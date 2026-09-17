"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentRunner = void 0;
const job_queue_1 = require("../queue/job-queue");
const logger_1 = require("../utils/logger");
const github_researcher_1 = require("../research/github-researcher");
const duplicate_detector_1 = require("../research/duplicate-detector");
const groq_provider_1 = require("../providers/groq-provider");
const db_1 = require("../storage/db");
const rate_limit_manager_1 = require("../limits/rate-limit-manager");
class AgentRunner {
    isRunning = false;
    pollIntervalMs;
    researchIntervalMs;
    aiProvider;
    githubResearcher;
    lastResearchEnqueuedMs = 0;
    constructor() {
        this.pollIntervalMs = parseInt(process.env.AGENT_POLL_INTERVAL_MS || '30000', 10);
        this.researchIntervalMs = parseInt(process.env.AGENT_RESEARCH_INTERVAL_MINUTES || '60', 10) * 60 * 1000;
        this.aiProvider = new groq_provider_1.GroqProvider();
        this.githubResearcher = new github_researcher_1.GithubResearcher();
    }
    async start() {
        await logger_1.logger.info('agent_start', 'Starting Nebula Agent Worker...');
        // 1. Recover stale locked jobs
        await job_queue_1.JobQueue.recoverStaleJobs(30);
        // 2. Begin main loop without overlapping
        this.loop();
    }
    async loop() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        try {
            await this.tick();
        }
        catch (e) {
            await logger_1.logger.error('agent_tick_error', e.message);
        }
        finally {
            this.isRunning = false;
            setTimeout(() => this.loop(), this.pollIntervalMs);
        }
    }
    async tick() {
        const nowMs = Date.now();
        if (nowMs - this.lastResearchEnqueuedMs > this.researchIntervalMs) {
            this.lastResearchEnqueuedMs = nowMs;
            await job_queue_1.JobQueue.enqueue(null, 'research_github', {});
            await logger_1.logger.info('scheduler', 'Enqueued period research_github job');
        }
        // Try to process queue
        let job = await job_queue_1.JobQueue.claimNextJob();
        while (job) {
            await logger_1.logger.info('job_claimed', `Claiming job ${job.id} [${job.job_type}]`);
            try {
                if (job.job_type === 'research_github') {
                    await this.processResearch(job);
                }
                else if (job.job_type === 'analyze_candidate') {
                    await this.processAnalyze(job);
                }
                else {
                    throw new Error(`Unknown job type: ${job.job_type}`);
                }
                await job_queue_1.JobQueue.completeJob(job.id);
            }
            catch (err) {
                // Determine retry strategies
                let delay = 0;
                if (err instanceof rate_limit_manager_1.RateLimitHitError) {
                    delay = err.retryAfterS;
                }
                else if (err instanceof rate_limit_manager_1.SafetyLimitReachedError) {
                    delay = 3600; // wait 1 hour if arbitrary manual daily cap is hit
                }
                await job_queue_1.JobQueue.failJob(job, err.message || err.toString(), delay);
                if (err instanceof rate_limit_manager_1.SafetyLimitReachedError) {
                    await logger_1.logger.warn('safety_pause', 'Safety limit reached. Pausing queue processing logic.');
                    break; // stop processing more
                }
            }
            // Immediately check for next immediately available job, but allow breathing room.
            job = await job_queue_1.JobQueue.claimNextJob();
        }
    }
    async processResearch(job) {
        const candidates = await this.githubResearcher.searchForCandidates();
        for (const c of candidates) {
            const isDup = await duplicate_detector_1.DuplicateDetector.isDuplicate(c.url, undefined, c.owner);
            if (!isDup) {
                // Enqueue analysis
                await job_queue_1.JobQueue.enqueue(job.run_id, 'analyze_candidate', c);
            }
        }
    }
    async processAnalyze(job) {
        const payload = job.payload;
        const isDup = await duplicate_detector_1.DuplicateDetector.isDuplicate(payload.url, undefined, payload.owner);
        if (isDup) {
            return;
        }
        const contextInfo = `Repository: ${payload.repoName}
Owner: ${payload.owner}
Description: ${payload.description}
Stars: ${payload.stars}
Language: ${payload.language}`;
        const analysis = await this.aiProvider.analyzeCandidate(contextInfo);
        if (analysis.qualified) {
            await db_1.db.from('agent_leads').insert({
                name: payload.repoName,
                organization_name: payload.owner,
                github_url: payload.url,
                source: 'github',
                source_url: payload.url,
                team_type: analysis.team_type,
                estimated_team_size: analysis.estimated_team_size,
                description: payload.description,
                relevance_score: analysis.relevance_score,
                relevance_reason: analysis.reasons.join(' | ') + (analysis.why_nebula_might_fit ? '\nFit: ' + analysis.why_nebula_might_fit : '')
            });
            await logger_1.logger.info('lead_qualified', `Found qualified candidate: ${payload.repoName} (${payload.url})`);
        }
        else {
            await logger_1.logger.info('lead_rejected', `Rejected candidate: ${payload.repoName} (Score: ${analysis.relevance_score})`);
        }
    }
}
exports.AgentRunner = AgentRunner;

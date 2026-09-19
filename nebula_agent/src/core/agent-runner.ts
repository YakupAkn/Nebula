import { JobQueue } from '../queue/job-queue';
import { logger } from '../utils/logger';
import { GithubResearcher } from '../research/github-researcher';
import { DuplicateDetector } from '../research/duplicate-detector';
import { GroqProvider } from '../providers/groq-provider';
import { AIProvider } from '../providers/ai-provider';
import { AgentJob } from '../types';
import { db } from '../storage/db';
import { RateLimitHitError, SafetyLimitReachedError } from '../limits/rate-limit-manager';
import { processMonitorVercel } from '../jobs/monitor-vercel';
import { processHealthCheck } from '../jobs/health-check';
import { IncidentAnalyzer } from '../ai/incident-analyzer';
import { ServiceMonitor } from '../monitors/service-monitor';
import { getSettings } from '../storage/agent-settings';

export class AgentRunner {
    private isRunning: boolean = false;
    private pollIntervalMs: number;
    private researchIntervalMs: number;
    private aiProvider: AIProvider;
    private githubResearcher: GithubResearcher;
    private incidentAnalyzer: IncidentAnalyzer;
    private lastResearchEnqueuedMs: number = 0;
    private lastMonitorVercelMs: number = 0;
    private lastHealthCheckMs: number = 0;
    private lastServiceCheckMs: number = 0;
    private lastPausedLogMs: number = 0;

    constructor() {
        this.pollIntervalMs = parseInt(process.env.AGENT_POLL_INTERVAL_MS || '30000', 10);
        this.researchIntervalMs = parseInt(process.env.AGENT_RESEARCH_INTERVAL_MINUTES || '60', 10) * 60 * 1000;
        this.aiProvider = new GroqProvider();
        this.githubResearcher = new GithubResearcher();
        this.incidentAnalyzer = new IncidentAnalyzer(this.aiProvider);
    }

    async start() {
        await logger.info('agent_start', 'Starting Nebula Agent Worker...');

        // 1. Recover stale locked jobs
        await JobQueue.recoverStaleJobs(30);

        // 2. Begin main loop without overlapping
        this.loop();
    }

    private async loop() {
        if (this.isRunning) return;
        this.isRunning = true;

        try {
            await this.tick();
        } catch (e: any) {
            await logger.error('agent_tick_error', e.message);
        } finally {
            this.isRunning = false;
            setTimeout(() => this.loop(), this.pollIntervalMs);
        }
    }

    private async tick() {
        const settings = await getSettings(true);
        if (!settings.agent_running) {
            if (Date.now() - this.lastPausedLogMs > 5 * 60 * 1000) {
                this.lastPausedLogMs = Date.now();
                await logger.info('agent_paused', 'Agent is STOPPED. Skipping enqueue and job processing.');
            }
            return;
        }

        const nowMs = Date.now();
        if (settings.github_enabled && nowMs - this.lastResearchEnqueuedMs > this.researchIntervalMs) {
            this.lastResearchEnqueuedMs = nowMs;
            await JobQueue.enqueue(null, 'research_github', {});
            await logger.info('scheduler', 'Enqueued period research_github job');
        }

        const healthInterval = parseInt(process.env.HEALTH_CHECK_INTERVAL_MS || '30000', 10);
        if (settings.health_enabled && nowMs - this.lastHealthCheckMs > healthInterval) {
            this.lastHealthCheckMs = nowMs;
            await JobQueue.enqueue(null, 'health_check', {});
        }

        const vercelInterval = 15000; // Hardcoded fast monitor for deployments
        if (settings.vercel_enabled && nowMs - this.lastMonitorVercelMs > vercelInterval) {
            this.lastMonitorVercelMs = nowMs;
            await JobQueue.enqueue(null, 'monitor_vercel', {});
        }

        // Service checks every 60 seconds
        const serviceInterval = 60000;
        if (nowMs - this.lastServiceCheckMs > serviceInterval) {
            this.lastServiceCheckMs = nowMs;
            await JobQueue.enqueue(null, 'check_services', {});
        }

        // Try to process queue
        let job = await JobQueue.claimNextJob();
        while (job) {
            await logger.info('job_claimed', `Claiming job ${job.id} [${job.job_type}]`);

            try {
                const live = await getSettings();
                if (!live.agent_running) {
                    await this.skipJob(job, 'Agent STOPPED mid-loop');
                    break;
                }

                if (job.job_type === 'research_github') {
                    if (!live.github_enabled) {
                        await this.skipJob(job, 'GitHub is OFF');
                    } else {
                        await this.processResearch(job);
                        await JobQueue.completeJob(job.id);
                    }
                } else if (job.job_type === 'analyze_candidate') {
                    if (!live.github_enabled) {
                        await this.skipJob(job, 'GitHub is OFF');
                    } else if (!live.ai_enabled) {
                        await this.skipJob(job, 'AI is OFF');
                    } else {
                        await this.processAnalyze(job);
                        await JobQueue.completeJob(job.id);
                    }
                } else if (job.job_type === 'monitor_vercel') {
                    if (!live.vercel_enabled) {
                        await this.skipJob(job, 'Vercel is OFF');
                    } else {
                        await processMonitorVercel();
                        await JobQueue.completeJob(job.id);
                    }
                } else if (job.job_type === 'health_check') {
                    if (!live.health_enabled) {
                        await this.skipJob(job, 'Health is OFF');
                    } else {
                        await processHealthCheck();
                        await JobQueue.completeJob(job.id);
                    }
                } else if (job.job_type === 'analyze_incident') {
                    if (!live.ai_enabled) {
                        await this.skipJob(job, 'AI is OFF');
                    } else {
                        await this.incidentAnalyzer.analyzeIncident(job.payload.incident_id);
                        await JobQueue.completeJob(job.id);
                    }
                } else if (job.job_type === 'check_services') {
                    await ServiceMonitor.runAll();
                    await JobQueue.completeJob(job.id);
                } else {
                    throw new Error(`Unknown job type: ${job.job_type}`);
                }
            } catch (err: any) {
                // Determine retry strategies
                let delay = 0;
                if (err instanceof RateLimitHitError) {
                    delay = err.retryAfterS;
                } else if (err instanceof SafetyLimitReachedError) {
                    delay = 3600; // wait 1 hour if arbitrary manual daily cap is hit
                }

                await JobQueue.failJob(job, err.message || err.toString(), delay);

                if (err instanceof SafetyLimitReachedError) {
                    await logger.warn('safety_pause', 'Safety limit reached. Pausing queue processing logic.');
                    break; // stop processing more
                }
            }

            // Immediately check for next immediately available job, but allow breathing room.
            job = await JobQueue.claimNextJob();
        }
    }

    private async skipJob(job: AgentJob, reason: string) {
        await logger.info('job_skipped', `Skipping ${job.job_type} (${job.id}): ${reason}`);
        await JobQueue.completeJob(job.id);
    }

    private async processResearch(job: AgentJob) {
        const candidates = await this.githubResearcher.searchForCandidates();
        for (const c of candidates) {
            const isDup = await DuplicateDetector.isDuplicate(c.url, undefined, c.owner);
            if (!isDup) {
                // Enqueue analysis
                await JobQueue.enqueue(job.run_id, 'analyze_candidate', c);
            }
        }
    }

    private async processAnalyze(job: AgentJob) {
        const payload = job.payload;
        const isDup = await DuplicateDetector.isDuplicate(payload.url, undefined, payload.owner);
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
            await db.from('agent_leads').insert({
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
            await logger.info('lead_qualified', `Found qualified candidate: ${payload.repoName} (${payload.url})`);
        } else {
            await logger.info('lead_rejected', `Rejected candidate: ${payload.repoName} (Score: ${analysis.relevance_score})`);
        }
    }
}

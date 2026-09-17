"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobQueue = void 0;
const db_1 = require("../storage/db");
const logger_1 = require("../utils/logger");
class JobQueue {
    static async enqueue(runId, jobType, payload, priority = 0) {
        const { data, error } = await db_1.db.from('agent_jobs').insert({
            run_id: runId,
            job_type: jobType,
            status: 'pending',
            priority,
            payload
        }).select().single();
        if (error || !data) {
            await logger_1.logger.error('queue_enqueue', 'Failed to enqueue job', { error, jobType });
            return null;
        }
        return data;
    }
    static async claimNextJob() {
        // 1. Fetch highest priority pending job that is available
        const now = new Date().toISOString();
        const { data: candidates, error: fetchError } = await db_1.db
            .from('agent_jobs')
            .select('*')
            .eq('status', 'pending')
            .lte('available_at', now)
            .order('priority', { ascending: false })
            .order('created_at', { ascending: true })
            .limit(1);
        if (fetchError || !candidates || candidates.length === 0) {
            return null;
        }
        const candidate = candidates[0];
        // 2. Perform optimistic locking update (safe against duplicates as only one will match status='pending')
        const { data: locked, error: lockError } = await db_1.db
            .from('agent_jobs')
            .update({ status: 'locked', locked_at: now })
            .eq('id', candidate.id)
            .eq('status', 'pending')
            .select()
            .single();
        if (lockError || !locked) {
            // Another worker might have grabbed it
            return null;
        }
        return locked;
    }
    static async completeJob(jobId) {
        await db_1.db.from('agent_jobs').update({
            status: 'completed',
            completed_at: new Date().toISOString()
        }).eq('id', jobId);
    }
    static async failJob(job, errMessage, retryDelayS = 0) {
        const nextAttempts = job.attempts + 1;
        if (nextAttempts >= job.max_attempts) {
            // Hard fail
            await db_1.db.from('agent_jobs').update({
                status: 'failed',
                last_error: errMessage,
                attempts: nextAttempts
            }).eq('id', job.id);
            await logger_1.logger.error('job_failed', `Job permanently failed after ${nextAttempts} attempts`, { jobId: job.id, last_error: errMessage });
        }
        else {
            // Soft fail (retry)
            let delayTime = new Date();
            // Default exponential backoff if no specific retry delay requested
            const actualDelay = retryDelayS > 0 ? retryDelayS : Math.pow(2, nextAttempts) * 60;
            delayTime.setSeconds(delayTime.getSeconds() + actualDelay);
            await db_1.db.from('agent_jobs').update({
                status: 'pending',
                last_error: errMessage,
                attempts: nextAttempts,
                available_at: delayTime.toISOString(),
                locked_at: null
            }).eq('id', job.id);
            await logger_1.logger.warn('job_retry', `Job failed, retrying in ${actualDelay}s`, { jobId: job.id, attempts: nextAttempts });
        }
    }
    static async recoverStaleJobs(timeoutMinutes = 30) {
        const staleTime = new Date();
        staleTime.setMinutes(staleTime.getMinutes() - timeoutMinutes);
        const { data, error } = await db_1.db
            .from('agent_jobs')
            .update({
            status: 'pending',
            locked_at: null,
            last_error: 'Recovered from stale lock'
        })
            .eq('status', 'locked')
            .lte('locked_at', staleTime.toISOString())
            .select('id');
        if (error) {
            await logger_1.logger.error('queue_recover', 'Failed to recover stale jobs', { error });
            return 0;
        }
        const count = data?.length || 0;
        if (count > 0) {
            await logger_1.logger.info('queue_recover', `Recovered ${count} stale jobs`);
        }
        return count;
    }
}
exports.JobQueue = JobQueue;

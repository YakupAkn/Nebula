import { db } from '../storage/db';
import { AgentJob } from '../types';
import { logger } from '../utils/logger';

export class JobQueue {
    static async enqueue(runId: string | null, jobType: string, payload: any, priority: number = 0): Promise<AgentJob | null> {
        const { data, error } = await db.from('agent_jobs').insert({
            run_id: runId,
            job_type: jobType,
            status: 'pending',
            priority,
            payload
        }).select().single();

        if (error || !data) {
            await logger.error('queue_enqueue', 'Failed to enqueue job', { error, jobType });
            return null;
        }
        return data as AgentJob;
    }

    static async claimNextJob(): Promise<AgentJob | null> {
        // 1. Fetch highest priority pending job that is available
        const now = new Date().toISOString();
        const { data: candidates, error: fetchError } = await db
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
        const { data: locked, error: lockError } = await db
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

        return locked as AgentJob;
    }

    static async completeJob(jobId: string): Promise<void> {
        await db.from('agent_jobs').update({
            status: 'completed',
            completed_at: new Date().toISOString()
        }).eq('id', jobId);
    }

    static async failJob(job: AgentJob, errMessage: string, retryDelayS: number = 0): Promise<void> {
        const nextAttempts = job.attempts + 1;

        if (nextAttempts >= job.max_attempts) {
            // Hard fail
            await db.from('agent_jobs').update({
                status: 'failed',
                last_error: errMessage,
                attempts: nextAttempts
            }).eq('id', job.id);
            await logger.error('job_failed', `Job permanently failed after ${nextAttempts} attempts`, { jobId: job.id, last_error: errMessage });
        } else {
            // Soft fail (retry)
            let delayTime = new Date();
            // Default exponential backoff if no specific retry delay requested
            const actualDelay = retryDelayS > 0 ? retryDelayS : Math.pow(2, nextAttempts) * 60;
            delayTime.setSeconds(delayTime.getSeconds() + actualDelay);

            await db.from('agent_jobs').update({
                status: 'pending',
                last_error: errMessage,
                attempts: nextAttempts,
                available_at: delayTime.toISOString(),
                locked_at: null
            }).eq('id', job.id);

            await logger.warn('job_retry', `Job failed, retrying in ${actualDelay}s`, { jobId: job.id, attempts: nextAttempts });
        }
    }

    static async recoverStaleJobs(timeoutMinutes: number = 30): Promise<number> {
        const staleTime = new Date();
        staleTime.setMinutes(staleTime.getMinutes() - timeoutMinutes);

        const { data, error } = await db
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
            await logger.error('queue_recover', 'Failed to recover stale jobs', { error });
            return 0;
        }

        const count = data?.length || 0;
        if (count > 0) {
            await logger.info('queue_recover', `Recovered ${count} stale jobs`);
        }
        return count;
    }
}

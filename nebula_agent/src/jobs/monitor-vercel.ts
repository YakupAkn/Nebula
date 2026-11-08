import { VercelClient } from '../integrations/vercel/vercel-client';
import { db } from '../storage/db';
import { logger } from '../utils/logger';
import { JobQueue } from '../queue/job-queue';

const vercel = new VercelClient();

export async function processMonitorVercel() {
    await logger.info('monitor_vercel', 'Checking for new Vercel production deployments...');

    const deployments = await vercel.getDeployments(5, 'production');

    for (const d of deployments) {
        // Find if exists
        const { data: existing } = await db.from('deployments')
            .select('id, status, is_known_good')
            .eq('deployment_id', d.uid)
            .single();

        if (!existing) {
            await logger.info('monitor_vercel', `New Vercel deployment detected: ${d.uid} [${d.state}]`);
            // Insert heavily
            await db.from('deployments').insert({
                deployment_id: d.uid,
                url: d.url,
                commit_sha: d.meta?.githubCommitSha || null,
                branch: d.meta?.githubCommitRef || null,
                environment: 'production',
                status: d.state,
                health_status: 'UNKNOWN',
                is_known_good: false
            });

            await db.from('agent_events').insert({
                event_type: 'NEW_DEPLOYMENT',
                deployment_id: d.uid,
                message: `New deployment detected via Vercel Monitor: ${d.uid}`
            });

        } else if (existing.status !== d.state) {
            // State changed (e.g. BUILDING -> READY)
            await logger.info('monitor_vercel', `Deployment ${d.uid} changed state ${existing.status} -> ${d.state}`);
            await db.from('deployments').update({
                status: d.state,
                updated_at: new Date().toISOString()
            }).eq('deployment_id', d.uid);

            await db.from('agent_events').insert({
                event_type: 'DEPLOYMENT_STATE_CHANGE',
                deployment_id: d.uid,
                message: `Deployment ${d.uid} state changed to ${d.state}`
            });
        }

        // If it's a new READY push, maybe we want to instantly kick off a health check explicitly.
        // We'll let the regular health check job pick it up since we'll enqueue that frequently.
    }
}

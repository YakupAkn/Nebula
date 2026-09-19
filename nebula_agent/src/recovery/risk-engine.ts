import { db } from '../storage/db';
import { logger } from '../utils/logger';

export class RecoveryPolicy {
    static get maxHealthFailures(): number {
        return parseInt(process.env.MAX_HEALTH_FAILURES || '3', 10);
    }

    static get maxErrorRate(): number {
        return parseInt(process.env.MAX_ERROR_RATE || '5', 10);
    }
}

export class RiskEngine {
    /**
     * Evaluates the current state of a deployment and creates incidents if critical.
     * Returns true if a ROLLBACK should be triggered.
     */
    static async evaluateDeploymentState(deploymentId: string): Promise<boolean> {
        const { data: deployment, error } = await db.from('deployments')
            .select('*')
            .eq('deployment_id', deploymentId)
            .single();

        if (error || !deployment) return false;

        // Determine if it violates the policy
        const isCritical = deployment.health_status === 'CRITICAL' || deployment.error_rate > RecoveryPolicy.maxErrorRate;
        const isSuspicious = deployment.health_status === 'DEGRADED';

        if (isCritical) {
            // Check if an incident already exists to avoid noise
            const { data: activeIncident } = await db.from('incidents')
                .select('*')
                .eq('deployment_id', deploymentId)
                .in('status', ['DETECTED', 'INVESTIGATING'])
                .single();

            if (!activeIncident) {
                const { data: incident } = await db.from('incidents').insert({
                    type: 'PRODUCTION_HEALTH_FAILURE',
                    severity: 'critical',
                    deployment_id: deploymentId,
                    status: 'DETECTED',
                    root_cause: `Repeated health check failures or high error rate (${deployment.error_rate}%)`,
                    summary: `Deployment ${deploymentId} has a health status of CRITICAL.`
                }).select().single();

                if (incident) {
                    await logger.warn('incident_detected', `Incident ${incident.id} created for deployment ${deploymentId}`);
                    const { isEnabled } = await import('../storage/agent-settings');
                    if (await isEnabled('ai_enabled')) {
                        const { JobQueue } = await import('../queue/job-queue');
                        await JobQueue.enqueue(null, 'analyze_incident', { incident_id: incident.id });
                    } else {
                        await logger.info('ai_disabled', 'AI is OFF; skipping incident analysis enqueue');
                    }
                }
            }

            return true;
        }

        if (isSuspicious) {
            await logger.info('risk_engine', `Deployment ${deploymentId} is suspicious but not critically failing. No automatic rollback yet.`);
        }

        return false;
    }
}

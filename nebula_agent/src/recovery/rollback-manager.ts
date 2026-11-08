import { db } from '../storage/db';
import { logger } from '../utils/logger';
import { VercelClient } from '../integrations/vercel/vercel-client';

const vercel = new VercelClient();

export class RollbackManager {
    static async performRecoveryForIncident(incidentId: string): Promise<boolean> {
        // 1. Fetch incident
        const { data: incident } = await db.from('incidents').select('*').eq('id', incidentId).single();
        if (!incident || !incident.deployment_id) return false;

        await logger.warn('rollback_manager', `Attempting recovery for incident ${incidentId}`);

        // Update incident status
        await db.from('incidents').update({ status: 'RECOVERING' }).eq('id', incidentId);

        // 2. Prevent Loop
        const cooldownMs = parseInt(process.env.ROLLBACK_COOLDOWN_MS || '300000', 10);
        const cooldownThreshold = new Date(Date.now() - cooldownMs).toISOString();

        const { count: recentRollbacks } = await db.from('deployments')
            .select('*', { count: 'exact', head: true })
            .not('rolled_back_at', 'is', null)
            .gte('rolled_back_at', cooldownThreshold);

        if ((recentRollbacks || 0) >= 2) {
            await logger.error('rollback_protection', 'Rollback limit reached. Stopping automation to prevent loops.');
            await db.from('incidents').update({
                status: 'MANUAL_INTERVENTION_REQUIRED',
                actions_taken: { error: 'Rollback limit reached in cooldown window' }
            }).eq('id', incidentId);
            return false;
        }

        // 3. Find known-good deployment
        const { data: knownGood } = await db.from('deployments')
            .select('*')
            .eq('is_known_good', true)
            .neq('deployment_id', incident.deployment_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (!knownGood) {
            await logger.error('rollback_manager', 'No previous known-good deployment found.');
            await db.from('incidents').update({
                status: 'MANUAL_INTERVENTION_REQUIRED',
                actions_taken: { error: 'No known-good deployment available for rollback' }
            }).eq('id', incidentId);
            return false;
        }

        // Verify known good health conceptually (already recorded as known good)

        // 4. Perform Rollback
        await db.from('agent_events').insert({
            event_type: 'ROLLBACK_STARTED',
            deployment_id: incident.deployment_id,
            message: `Starting rollback to known-good deployment ${knownGood.deployment_id}`,
            metadata: { target: knownGood.deployment_id }
        });

        const success = await vercel.rollbackProduction(knownGood.deployment_id);

        if (success) {
            // Update incident
            await db.from('incidents').update({
                status: 'RECOVERED',
                resolved_at: new Date().toISOString(),
                actions_taken: { action: 'rolled_back', target: knownGood.deployment_id }
            }).eq('id', incidentId);

            // Mark bad deployment
            await db.from('deployments').update({
                rolled_back_at: new Date().toISOString(),
                rollback_reason: `Incident ${incidentId}: ${incident.root_cause || 'Critical Failure'}`
            }).eq('deployment_id', incident.deployment_id);

            await db.from('agent_events').insert({
                event_type: 'ROLLBACK_COMPLETED',
                deployment_id: incident.deployment_id,
                message: `Successfully rolled back to to ${knownGood.deployment_id}`
            });

            return true;

        } else {
            await db.from('incidents').update({
                status: 'MANUAL_INTERVENTION_REQUIRED',
                actions_taken: { error: 'Vercel SDK rollback failed' }
            }).eq('id', incidentId);

            return false;
        }
    }
}

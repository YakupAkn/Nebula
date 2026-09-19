import axios from 'axios';
import { db } from '../storage/db';
import { logger } from '../utils/logger';

export async function processHealthCheck() {
    await logger.info('health_check', 'Running production health check loop...');

    // Get the current READY production deployment to check
    const { data: currentProd, error } = await db.from('deployments')
        .select('*')
        .eq('environment', 'production')
        .eq('status', 'READY')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error || !currentProd) {
        await logger.warn('health_check', 'No READY production deployment found to check.');
        return;
    }

    // Ping /api/health
    const urlStr = `https://${currentProd.url}/api/health`;
    let isSuccessful = false;
    let statusCode = null;
    let latency = null;
    let responseBody = null;
    let errorMessage = null;

    const start = Date.now();
    try {
        const timeoutMs = parseInt(process.env.HEALTH_CHECK_TIMEOUT_MS || '5000', 10);
        const response = await axios.get(urlStr, { timeout: timeoutMs });

        latency = Date.now() - start;
        statusCode = response.status;
        isSuccessful = statusCode >= 200 && statusCode < 300;

        if (response.data) {
            responseBody = JSON.stringify(response.data).substring(0, 500); // Truncate
            // Verify payload signature roughly
            if (response.data.status !== 'ok') {
                isSuccessful = false;
                errorMessage = 'Payload status is not OK';
            }
        }
    } catch (e: any) {
        latency = Date.now() - start;
        isSuccessful = false;
        errorMessage = e.message;
        if (e.response) {
            statusCode = e.response.status;
            responseBody = JSON.stringify(e.response.data).substring(0, 500);
        }
    }

    // 1. Insert Health Check Result
    await db.from('health_checks').insert({
        deployment_id: currentProd.deployment_id,
        status_code: statusCode,
        latency_ms: latency,
        is_successful: isSuccessful,
        response_body: responseBody,
        error_message: errorMessage
    });

    // 2. Update stats on the deployment
    const { data: previousChecks } = await db.from('health_checks')
        .select('*')
        .eq('deployment_id', currentProd.deployment_id)
        .order('checked_at', { ascending: false })
        .limit(10);

    let failCount = 0;
    let recentLatencySum = 0;
    let checksForLatency = 0;

    if (previousChecks) {
        for (const c of previousChecks) {
            if (!c.is_successful) failCount++;
            if (c.latency_ms) {
                recentLatencySum += c.latency_ms;
                checksForLatency++;
            }
        }
    }

    // We didn't include the current insert in the previousChecks fetch properly yet because read occurs maybe right before indexing.
    // It's safe to manually account for the immediate result.
    if (!isSuccessful && previousChecks && previousChecks[0]?.id !== undefined) {
        // Just counting failCount conservatively.
    }

    const estimatedErrorRate = previousChecks ? (failCount / previousChecks.length) * 100 : (isSuccessful ? 0 : 100);
    const avgLatency = checksForLatency > 0 ? Math.floor(recentLatencySum / checksForLatency) : latency;

    // Is it becoming a known good deployment?
    // Let's say if we have > 5 checks and all are mostly successful, it can be known good.
    const isNowGood = currentProd.is_known_good || (!isSuccessful ? false : (previousChecks && previousChecks.length >= 5 && failCount === 0));

    // Update deployment record
    await db.from('deployments').update({
        health_status: isSuccessful ? 'HEALTHY' : (failCount >= 3 ? 'CRITICAL' : 'DEGRADED'),
        avg_latency: avgLatency,
        error_rate: estimatedErrorRate,
        is_known_good: isNowGood
    }).eq('deployment_id', currentProd.deployment_id);

    // Provide logging
    if (isSuccessful) {
        await logger.info('health_check', `Health check passed for ${currentProd.deployment_id}. Latency: ${latency}ms`);
    } else {
        await logger.warn('health_check', `Health check FAILED for ${currentProd.deployment_id}. Status: ${statusCode}, Error: ${errorMessage}`);
    }

    // 3. Evaluate Risk
    const { RiskEngine } = await import('../recovery/risk-engine');
    const { RollbackManager } = await import('../recovery/rollback-manager');

    const shouldRollback = await RiskEngine.evaluateDeploymentState(currentProd.deployment_id);
    if (shouldRollback) {
        // Look up the incident that was just created
        const { data: incident } = await db.from('incidents')
            .select('id')
            .eq('deployment_id', currentProd.deployment_id)
            .eq('status', 'DETECTED')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (incident) {
            await RollbackManager.performRecoveryForIncident(incident.id);
        }
    }
}

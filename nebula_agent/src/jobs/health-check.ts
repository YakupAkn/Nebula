import axios from 'axios';
import { db } from '../storage/db';
import { logger } from '../utils/logger';
import { VercelClient } from '../integrations/vercel/vercel-client';

type CheckResult = {
    url: string;
    statusCode: number | null;
    latencyMs: number;
    successful: boolean;
    errorMessage: string | null;
    responseBody: string | null;
};

async function checkUrl(
    url: string,
    validatePayload = false
): Promise<CheckResult> {
    const start = Date.now();

    try {
        const timeoutMs = parseInt(
            process.env.HEALTH_CHECK_TIMEOUT_MS || '5000',
            10
        );

        const response = await axios.get(url, {
            timeout: timeoutMs,
            validateStatus: () => true,
        });

        const latencyMs = Date.now() - start;
        const statusCode = response.status;

        let successful = statusCode >= 200 && statusCode < 300;
        let errorMessage: string | null = null;

        if (!successful) {
            errorMessage = `HTTP ${statusCode}`;
        }

        let responseBody: string | null = null;

        if (response.data !== undefined && response.data !== null) {
            responseBody = JSON.stringify(response.data).substring(0, 500);
        }

        if (
            validatePayload &&
            successful &&
            (!response.data || response.data.status !== 'ok')
        ) {
            successful = false;
            errorMessage = 'Health payload status is not ok';
        }

        return {
            url,
            statusCode,
            latencyMs,
            successful,
            errorMessage,
            responseBody,
        };
    } catch (error: any) {
        return {
            url,
            statusCode: error?.response?.status ?? null,
            latencyMs: Date.now() - start,
            successful: false,
            errorMessage: error?.message || 'Unknown health check error',
            responseBody: error?.response?.data
                ? JSON.stringify(error.response.data).substring(0, 500)
                : null,
        };
    }
}

export async function processHealthCheck() {
    await logger.info(
        'health_check',
        'Running production health check...'
    );

    /*
     * 1. Find the actual active Vercel production deployment.
     */
    const vercel = new VercelClient();
    const currentProduction =
        await vercel.getCurrentProductionDeployment();

    if (!currentProduction) {
        await logger.warn(
            'health_check',
            'No active Vercel production deployment found.'
        );
        return;
    }

    /*
     * 2. Find the matching deployment in our database.
     */
    const { data: currentProd, error: deploymentError } = await db
        .from('deployments')
        .select('*')
        .eq('deployment_id', currentProduction.uid)
        .maybeSingle();

    if (deploymentError) {
        await logger.error(
            'health_check',
            `Failed to query production deployment: ${deploymentError.message}`
        );
        return;
    }

    if (!currentProd) {
        await logger.warn(
            'health_check',
            `Production deployment ${currentProduction.uid} is not yet in the database.`
        );
        return;
    }

    /*
     * 3. Check the canonical production domain.
     *
     * Never use the temporary Vercel deployment URL here.
     */
    const productionDomain =
        process.env.VERCEL_PRODUCTION_DOMAIN ||
        'nebulateamapp.vercel.app';

    const baseUrl = `https://${productionDomain}`;

    const siteCheck = await checkUrl(baseUrl);

    const healthCheck = await checkUrl(
        `${baseUrl}/api/health`,
        true
    );

    /*
     * 4. Log both checks separately.
     */
    await logger.info(
        'health_check',
        `Site: ${siteCheck.successful ? 'UP' : 'DOWN'} ` +
        `HTTP ${siteCheck.statusCode ?? 'ERR'} ` +
        `${siteCheck.latencyMs}ms`
    );

    await logger.info(
        'health_check',
        `Health API: ${healthCheck.successful ? 'UP' : 'DOWN'} ` +
        `HTTP ${healthCheck.statusCode ?? 'ERR'} ` +
        `${healthCheck.latencyMs}ms`
    );

    /*
     * 5. Store health check.
     */
    await db.from('health_checks').insert({
        deployment_id: currentProd.deployment_id,
        status_code: healthCheck.statusCode,
        latency_ms: healthCheck.latencyMs,
        is_successful: healthCheck.successful,
        response_body: healthCheck.responseBody,
        error_message: healthCheck.errorMessage,
    });

    /*
     * 6. Read recent health history.
     */
    const { data: previousChecks } = await db
        .from('health_checks')
        .select('id, is_successful, latency_ms, checked_at')
        .eq('deployment_id', currentProd.deployment_id)
        .order('checked_at', { ascending: false })
        .limit(10);

    const checks = previousChecks || [];

    const failedChecks = checks.filter(
        check => !check.is_successful
    ).length;

    const latencyValues = checks
        .map(check => check.latency_ms)
        .filter(
            (value): value is number =>
                typeof value === 'number' && value >= 0
        );

    const avgLatency =
        latencyValues.length > 0
            ? Math.round(
                latencyValues.reduce(
                    (sum, value) => sum + value,
                    0
                ) / latencyValues.length
            )
            : healthCheck.latencyMs;

    const errorRate =
        checks.length > 0
            ? (failedChecks / checks.length) * 100
            : healthCheck.successful
                ? 0
                : 100;

    /*
     * 7. Determine health.
     */
    let healthStatus:
        | 'HEALTHY'
        | 'DEGRADED'
        | 'CRITICAL';

    if (siteCheck.successful && healthCheck.successful) {
        healthStatus = 'HEALTHY';
    } else if (siteCheck.successful) {
        healthStatus = 'DEGRADED';
    } else if (failedChecks >= 3) {
        healthStatus = 'CRITICAL';
    } else {
        healthStatus = 'DEGRADED';
    }

    /*
     * 8. Known-good deployment.
     */
    const isKnownGood =
        currentProd.is_known_good ||
        (
            checks.length >= 5 &&
            failedChecks === 0 &&
            siteCheck.successful &&
            healthCheck.successful
        );

    /*
     * 9. Update deployment health.
     */
    await db
        .from('deployments')
        .update({
            health_status: healthStatus,
            avg_latency: avgLatency,
            error_rate: errorRate,
            is_known_good: isKnownGood,
            updated_at: new Date().toISOString(),
        })
        .eq('deployment_id', currentProd.deployment_id);

    /*
     * 10. Final log.
     */
    if (healthStatus === 'HEALTHY') {
        await logger.info(
            'health_check',
            `Production HEALTHY: ${currentProd.deployment_id} ` +
            `site=${siteCheck.latencyMs}ms ` +
            `health=${healthCheck.latencyMs}ms ` +
            `errorRate=${errorRate.toFixed(1)}%`
        );
    } else {
        await logger.warn(
            'health_check',
            `Production ${healthStatus}: ${currentProd.deployment_id} ` +
            `site=${siteCheck.successful ? 'UP' : 'DOWN'} ` +
            `health=${healthCheck.successful ? 'UP' : 'DOWN'} ` +
            `errorRate=${errorRate.toFixed(1)}%`
        );
    }
}
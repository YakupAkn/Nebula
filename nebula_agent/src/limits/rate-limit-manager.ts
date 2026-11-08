import { db } from '../storage/db';
import { logger } from '../utils/logger';

export class RateLimitHitError extends Error {
    retryAfterS: number;
    constructor(retryAfterS: number) {
        super('Rate Limit Hit');
        this.name = 'RateLimitHitError';
        this.retryAfterS = retryAfterS;
    }
}

export class SafetyLimitReachedError extends Error {
    constructor(msg: string) {
        super(msg);
        this.name = 'SafetyLimitReachedError';
    }
}

export class RateLimitManager {
    static getDailyMax(): number {
        return parseInt(process.env.AGENT_MAX_AI_REQUESTS_PER_DAY || '50', 10);
    }

    static async reserveRequest(): Promise<void> {
        const today = new Date().toISOString().split('T')[0];
        const max = this.getDailyMax();

        // Single agent safe read-update, pessimistic concurrency is not heavily needed for single-thread local worker.
        let { data, error } = await db
            .from('agent_usage_daily')
            .select('*')
            .eq('usage_date', today)
            .single();

        if (error && error.code === 'PGRST116') { // not found
            // Create record
            const { data: inserted, error: insertError } = await db
                .from('agent_usage_daily')
                .insert({ usage_date: today, ai_requests: 0 })
                .select()
                .single();

            if (!insertError && inserted) {
                data = inserted;
            }
        }

        if (data && data.ai_requests >= max) {
            await logger.warn('safety_limit', `Reached local safety limit: ${data.ai_requests}/${max} today.`);
            throw new SafetyLimitReachedError(`Daily safety capacity ${max} reached.`);
        }

        // Increment successfully
        await db
            .from('agent_usage_daily')
            .update({ ai_requests: (data?.ai_requests || 0) + 1 })
            .eq('usage_date', today);
    }

    static async recordSuccess(inputTokens: number = 0, outputTokens: number = 0): Promise<void> {
        const today = new Date().toISOString().split('T')[0];
        // Execute raw internal RPC or just increment using a normal read/write.
        // For simplicity in a single worker, we optimistic update
        const { data } = await db.from('agent_usage_daily').select('successful_requests, input_tokens, output_tokens').eq('usage_date', today).single();
        if (data) {
            await db.from('agent_usage_daily')
                .update({
                    successful_requests: (data.successful_requests || 0) + 1,
                    input_tokens: (data.input_tokens || 0) + inputTokens,
                    output_tokens: (data.output_tokens || 0) + outputTokens
                })
                .eq('usage_date', today);
        }
    }

    static async recordFailure(wasRateLimit: boolean): Promise<void> {
        const today = new Date().toISOString().split('T')[0];
        const { data } = await db.from('agent_usage_daily').select('failed_requests, rate_limit_hits').eq('usage_date', today).single();
        if (data) {
            await db.from('agent_usage_daily')
                .update({
                    failed_requests: (data.failed_requests || 0) + (wasRateLimit ? 0 : 1),
                    rate_limit_hits: (data.rate_limit_hits || 0) + (wasRateLimit ? 1 : 0)
                })
                .eq('usage_date', today);
        }
    }
}

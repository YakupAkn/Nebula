import axios from 'axios';
import { db } from '../storage/db';
import { logger } from '../utils/logger';

interface ServiceCheck {
    name: string;
    status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN' | 'OFFLINE';
    latency_ms: number | null;
    details: Record<string, any>;
}

export class ServiceMonitor {
    /**
     * Run all service checks and persist results.
     */
    static async runAll(): Promise<ServiceCheck[]> {
        const checks: ServiceCheck[] = await Promise.all([
            this.checkSupabase(),
            this.checkVercel(),
            this.checkGroq(),
            this.checkGithub(),
            this.checkProductionURL(),
        ]);

        // Persist each result into service_status (upsert)
        for (const check of checks) {
            await db.from('service_status')
                .upsert({
                    service_name: check.name,
                    status: check.status,
                    last_check_at: new Date().toISOString(),
                    details: { latency_ms: check.latency_ms, ...check.details },
                }, { onConflict: 'service_name' });
        }

        return checks;
    }

    private static async checkSupabase(): Promise<ServiceCheck> {
        const start = Date.now();
        try {
            const { data, error } = await db.from('agent_logs').select('id').limit(1);
            const latency = Date.now() - start;
            if (error) {
                return { name: 'Supabase', status: 'DEGRADED', latency_ms: latency, details: { error: error.message } };
            }
            return { name: 'Supabase', status: latency > 3000 ? 'DEGRADED' : 'HEALTHY', latency_ms: latency, details: {} };
        } catch (e: any) {
            return { name: 'Supabase', status: 'CRITICAL', latency_ms: Date.now() - start, details: { error: e.message } };
        }
    }

    private static async checkVercel(): Promise<ServiceCheck> {
        const token = process.env.VERCEL_TOKEN;
        if (!token) {
            return { name: 'Vercel', status: 'UNKNOWN', latency_ms: null, details: { reason: 'VERCEL_TOKEN not configured' } };
        }
        const start = Date.now();
        try {
            const res = await axios.get('https://api.vercel.com/v2/user', {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000,
            });
            const latency = Date.now() - start;
            return { name: 'Vercel', status: latency > 3000 ? 'DEGRADED' : 'HEALTHY', latency_ms: latency, details: { user: res.data?.user?.username || 'ok' } };
        } catch (e: any) {
            return { name: 'Vercel', status: e.response?.status === 403 ? 'CRITICAL' : 'DEGRADED', latency_ms: Date.now() - start, details: { error: e.message } };
        }
    }

    private static async checkGroq(): Promise<ServiceCheck> {
        const key = process.env.GROQ_API_KEY;
        if (!key) {
            return { name: 'Groq AI', status: 'UNKNOWN', latency_ms: null, details: { reason: 'GROQ_API_KEY not configured' } };
        }
        const start = Date.now();
        try {
            const res = await axios.get('https://api.groq.com/openai/v1/models', {
                headers: { Authorization: `Bearer ${key}` },
                timeout: 5000,
            });
            const latency = Date.now() - start;
            return { name: 'Groq AI', status: latency > 3000 ? 'DEGRADED' : 'HEALTHY', latency_ms: latency, details: { models: res.data?.data?.length || 0 } };
        } catch (e: any) {
            return { name: 'Groq AI', status: 'DEGRADED', latency_ms: Date.now() - start, details: { error: e.message } };
        }
    }

    private static async checkGithub(): Promise<ServiceCheck> {
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            return { name: 'GitHub', status: 'UNKNOWN', latency_ms: null, details: { reason: 'GITHUB_TOKEN not configured' } };
        }
        const start = Date.now();
        try {
            const res = await axios.get('https://api.github.com/rate_limit', {
                headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'Nebula-Agent' },
                timeout: 5000,
            });
            const latency = Date.now() - start;
            const remaining = res.data?.rate?.remaining ?? 0;
            const status = remaining < 10 ? 'DEGRADED' : (latency > 3000 ? 'DEGRADED' : 'HEALTHY');
            return { name: 'GitHub', status, latency_ms: latency, details: { rate_remaining: remaining } };
        } catch (e: any) {
            return { name: 'GitHub', status: 'DEGRADED', latency_ms: Date.now() - start, details: { error: e.message } };
        }
    }

    private static async checkProductionURL(): Promise<ServiceCheck> {
        const prodUrl = process.env.PRODUCTION_URL;
        if (!prodUrl) {
            // Try to get latest deployment URL from DB
            const { data } = await db.from('deployments')
                .select('url')
                .eq('environment', 'production')
                .eq('status', 'READY')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            if (!data) {
                return { name: 'Production', status: 'UNKNOWN', latency_ms: null, details: { reason: 'No production deployment found' } };
            }
            return this.pingUrl('Production', `https://${data.url}`);
        }
        return this.pingUrl('Production', prodUrl);
    }

    private static async pingUrl(name: string, url: string): Promise<ServiceCheck> {
        const start = Date.now();
        try {
            const res = await axios.get(url, { timeout: 5000, maxRedirects: 3, validateStatus: () => true });
            const latency = Date.now() - start;
            const ok = res.status >= 200 && res.status < 400;
            return {
                name,
                status: ok ? (latency > 3000 ? 'DEGRADED' : 'HEALTHY') : 'CRITICAL',
                latency_ms: latency,
                details: { status_code: res.status },
            };
        } catch (e: any) {
            return { name, status: 'CRITICAL', latency_ms: Date.now() - start, details: { error: e.message } };
        }
    }
}

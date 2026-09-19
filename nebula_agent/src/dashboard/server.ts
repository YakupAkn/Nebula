import express from 'express';
import path from 'path';
import { db } from '../storage/db';
import { logger } from '../utils/logger';

export class DashboardServer {
    private app: express.Application;
    private port: number;
    private startTime: number;

    constructor() {
        this.app = express();
        this.port = parseInt(process.env.DASHBOARD_PORT || '3000', 10);
        this.startTime = Date.now();
        this.setupRoutes();
    }

    private authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
        const password = process.env.DASHBOARD_PASSWORD;
        if (!password) {
            return next(); // No auth configured, allow access
        }

        const authHeader = req.headers.authorization;
        if (authHeader === `Bearer ${password}`) {
            return next();
        }

        // Also accept cookie-based auth
        const cookie = req.headers.cookie;
        if (cookie && cookie.includes(`ncc_auth=${password}`)) {
            return next();
        }

        // For API calls, return 401
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // For page loads, let the frontend handle auth
        return next();
    }

    private setupRoutes() {
        this.app.use(express.json());

        // Auth login endpoint
        this.app.post('/api/auth/login', (req, res) => {
            const { password } = req.body;
            const expected = process.env.DASHBOARD_PASSWORD;
            if (!expected || password === expected) {
                res.json({ success: true, token: expected || 'open' });
            } else {
                res.status(401).json({ success: false, error: 'Invalid password' });
            }
        });

        // Protected API routes
        this.app.use('/api/', (req, res, next) => {
            if (req.path === '/auth/login') return next();
            this.authenticate(req, res, next);
        });

        // ── Status Overview ───────────────────────────────────────────
        this.app.get('/api/status', async (_req, res) => {
            try {
                const { data: currentProd } = await db.from('deployments')
                    .select('*')
                    .eq('environment', 'production')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                let overallHealth = 'UNKNOWN';
                if (currentProd) {
                    overallHealth = currentProd.health_status;
                }

                // Get active incident count
                const { count: activeIncidents } = await db.from('incidents')
                    .select('*', { count: 'exact', head: true })
                    .in('status', ['DETECTED', 'INVESTIGATING', 'RECOVERING', 'MANUAL_INTERVENTION_REQUIRED']);

                // Get last health check
                const { data: lastCheck } = await db.from('health_checks')
                    .select('*')
                    .order('checked_at', { ascending: false })
                    .limit(1)
                    .single();

                // Get last recovery action
                const { data: lastRecovery } = await db.from('agent_events')
                    .select('*')
                    .in('event_type', ['ROLLBACK_STARTED', 'ROLLBACK_COMPLETED'])
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                // Determine overall status considering incidents
                if ((activeIncidents || 0) > 0 && overallHealth !== 'CRITICAL') {
                    if (currentProd?.health_status === 'HEALTHY') {
                        overallHealth = 'RECOVERING';
                    }
                }

                res.json({
                    overall_health: overallHealth,
                    current_deployment: currentProd,
                    active_incidents: activeIncidents || 0,
                    last_health_check: lastCheck,
                    last_recovery: lastRecovery,
                    recovery_mode: process.env.RECOVERY_MODE || 'live',
                    agent_uptime: Math.floor((Date.now() - this.startTime) / 1000),
                });
            } catch (e: any) {
                res.status(500).json({ error: e.message });
            }
        });

        // ── Deployments ───────────────────────────────────────────────
        this.app.get('/api/deployments', async (_req, res) => {
            try {
                const { data } = await db.from('deployments')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(30);
                res.json(data || []);
            } catch (e: any) {
                res.status(500).json({ error: e.message });
            }
        });

        // ── Incidents ─────────────────────────────────────────────────
        this.app.get('/api/incidents', async (_req, res) => {
            try {
                const { data } = await db.from('incidents')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);
                res.json(data || []);
            } catch (e: any) {
                res.status(500).json({ error: e.message });
            }
        });

        // ── Agent Events / Activity Feed ──────────────────────────────
        this.app.get('/api/events', async (_req, res) => {
            try {
                const { data } = await db.from('agent_events')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(100);
                res.json(data || []);
            } catch (e: any) {
                res.status(500).json({ error: e.message });
            }
        });

        // ── Health Checks ─────────────────────────────────────────────
        this.app.get('/api/health_checks', async (req, res) => {
            try {
                const limit = parseInt(req.query.limit as string || '100', 10);
                const { data } = await db.from('health_checks')
                    .select('*')
                    .order('checked_at', { ascending: false })
                    .limit(Math.min(limit, 500));
                res.json(data || []);
            } catch (e: any) {
                res.status(500).json({ error: e.message });
            }
        });

        // ── Service Status ────────────────────────────────────────────
        this.app.get('/api/services', async (_req, res) => {
            try {
                const { data } = await db.from('service_status')
                    .select('*')
                    .order('service_name');
                res.json(data || []);
            } catch (e: any) {
                res.status(500).json({ error: e.message });
            }
        });

        // ── Job Queue ─────────────────────────────────────────────────
        this.app.get('/api/jobs', async (req, res) => {
            try {
                const statusFilter = (req.query.status as string) || null;
                let query = db.from('agent_jobs')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (statusFilter) {
                    query = query.eq('status', statusFilter);
                }

                const { data } = await query;

                // Also get counts by status
                const counts: Record<string, number> = { pending: 0, locked: 0, completed: 0, failed: 0 };
                for (const status of Object.keys(counts)) {
                    const { count } = await db.from('agent_jobs')
                        .select('*', { count: 'exact', head: true })
                        .eq('status', status);
                    counts[status] = count || 0;
                }

                res.json({ jobs: data || [], counts });
            } catch (e: any) {
                res.status(500).json({ error: e.message });
            }
        });

        // ── Agent Info ────────────────────────────────────────────────
        this.app.get('/api/agent', async (_req, res) => {
            try {
                const services = [
                    { name: 'Worker', status: 'RUNNING' },
                    { name: 'Scheduler', status: 'RUNNING' },
                    { name: 'Vercel Monitor', status: process.env.VERCEL_TOKEN ? 'RUNNING' : 'OFFLINE' },
                    { name: 'Health Monitor', status: 'RUNNING' },
                    { name: 'Error Monitor', status: 'RUNNING' },
                    { name: 'Recovery Engine', status: process.env.RECOVERY_MODE === 'dry-run' ? 'DRY-RUN' : 'ARMED' },
                    { name: 'AI Analyzer', status: process.env.GROQ_API_KEY ? 'RUNNING' : 'OFFLINE' },
                ];

                // Count jobs processed today
                const today = new Date().toISOString().split('T')[0];
                const { count: processedToday } = await db.from('agent_jobs')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'completed')
                    .gte('completed_at', today + 'T00:00:00Z');

                const { count: failedToday } = await db.from('agent_jobs')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'failed')
                    .gte('created_at', today + 'T00:00:00Z');

                const { count: running } = await db.from('agent_jobs')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'locked');

                res.json({
                    services,
                    jobs_processed_today: processedToday || 0,
                    jobs_failed_today: failedToday || 0,
                    jobs_running: running || 0,
                    uptime_seconds: Math.floor((Date.now() - this.startTime) / 1000),
                    recovery_mode: process.env.RECOVERY_MODE || 'live',
                    started_at: new Date(this.startTime).toISOString(),
                });
            } catch (e: any) {
                res.status(500).json({ error: e.message });
            }
        });

        // ── Health Check Chart Data ───────────────────────────────────
        this.app.get('/api/health_checks/chart', async (req, res) => {
            try {
                const minutes = parseInt(req.query.minutes as string || '60', 10);
                const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();

                const { data } = await db.from('health_checks')
                    .select('status_code, latency_ms, is_successful, checked_at')
                    .gte('checked_at', since)
                    .order('checked_at', { ascending: true });

                res.json(data || []);
            } catch (e: any) {
                res.status(500).json({ error: e.message });
            }
        });

        // ── Agent Logs ────────────────────────────────────────────────
        this.app.get('/api/logs', async (req, res) => {
            try {
                const level = (req.query.level as string) || null;
                const limit = parseInt(req.query.limit as string || '100', 10);
                let query = db.from('agent_logs')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(Math.min(limit, 500));

                if (level) {
                    query = query.eq('level', level);
                }

                const { data } = await query;
                res.json(data || []);
            } catch (e: any) {
                res.status(500).json({ error: e.message });
            }
        });

        // ── Static files (serve dashboard) ────────────────────────────
        this.app.use(express.static(path.join(__dirname, 'public')));

        // SPA fallback: serve index.html for all non-API routes
        this.app.get('/{*splat}', (_req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        });
    }

    public start() {
        this.app.listen(this.port, () => {
            logger.info('dashboard', `Nebula Control Center listening on http://localhost:${this.port}`);
        });
    }
}

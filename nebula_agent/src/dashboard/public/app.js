// ─── Nebula Control Center ─── Client Application
(function () {
    'use strict';

    let authToken = localStorage.getItem('ncc_token') || '';
    const API = '';

    // ── Auth ──
    function checkAuth() {
        const pw = (new URLSearchParams(window.location.search)).get('pw');
        if (pw) { authToken = pw; localStorage.setItem('ncc_token', pw); }
        if (!authToken) { showLogin(); return; }
        hideLogin();
    }

    function showLogin() {
        document.getElementById('login-overlay').style.display = 'flex';
        document.getElementById('app-shell').style.display = 'none';
    }

    function hideLogin() {
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('app-shell').style.display = 'flex';
    }

    document.getElementById('login-btn').addEventListener('click', async () => {
        const pw = document.getElementById('login-pw').value;
        try {
            const r = await fetch(API + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) });
            const d = await r.json();
            if (d.success) { authToken = d.token; localStorage.setItem('ncc_token', authToken); hideLogin(); refreshAll(); }
            else { document.getElementById('login-err').textContent = 'Invalid password'; }
        } catch (e) { document.getElementById('login-err').textContent = 'Connection error'; }
    });

    document.getElementById('login-pw').addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('login-btn').click(); });

    // ── API Helper ──
    async function api(path, opts) {
        const r = await fetch(API + path, {
            method: (opts && opts.method) || 'GET',
            headers: {
                Authorization: 'Bearer ' + authToken,
                'Content-Type': 'application/json'
            },
            body: opts && opts.body ? JSON.stringify(opts.body) : undefined
        });
        if (r.status === 401) { showLogin(); throw new Error('Unauthorized'); }
        const data = await r.json();
        if (!r.ok && data && data.error) throw new Error(data.error);
        return data;
    }

    // ── Navigation ──
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');
    const titles = { overview: 'Overview', health: 'Production Health', deployments: 'Deployments', incidents: 'Incidents', agent: 'Agent Status', jobs: 'Job Queue', logs: 'Logs', console: 'Console' };

    navItems.forEach(n => n.addEventListener('click', () => {
        const pg = n.dataset.page;
        navItems.forEach(x => x.classList.remove('active'));
        n.classList.add('active');
        pages.forEach(p => p.classList.toggle('active', p.id === 'page-' + pg));
        document.getElementById('page-title').textContent = titles[pg] || pg;
        refreshAll();
    }));

    // ── Helpers ──
    function timeAgo(iso) {
        if (!iso) return '--';
        const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
        if (s < 60) return s + 's ago';
        if (s < 3600) return Math.floor(s / 60) + 'm ago';
        if (s < 86400) return Math.floor(s / 3600) + 'h ago';
        return Math.floor(s / 86400) + 'd ago';
    }

    function fmtTime(iso) {
        if (!iso) return '--';
        return new Date(iso).toLocaleTimeString([], { hour12: false });
    }

    function healthDot(h) {
        const m = { HEALTHY: 'healthy', DEGRADED: 'degraded', CRITICAL: 'critical', UNKNOWN: 'unknown', OFFLINE: 'offline' };
        return '<span class="dot dot-' + (m[h] || 'unknown') + '"></span>';
    }

    function healthBadge(h) {
        const m = { HEALTHY: 'healthy', DEGRADED: 'degraded', CRITICAL: 'critical', RECOVERING: 'recovering', UNKNOWN: 'unknown' };
        return '<span class="badge badge-' + (m[h] || 'unknown') + '">' + (h || 'UNKNOWN') + '</span>';
    }

    function statusBadge(s) {
        const m = { READY: 'healthy', BUILDING: 'degraded', ERROR: 'critical', CANCELED: 'critical' };
        return '<span class="badge badge-' + (m[s] || 'unknown') + '">' + (s || '--') + '</span>';
    }

    function jobBadge(s) {
        const m = { pending: 'degraded', locked: 'recovering', completed: 'healthy', failed: 'critical' };
        return '<span class="badge badge-' + (m[s] || 'unknown') + '">' + s + '</span>';
    }

    function levelBadge(l) {
        const m = { info: 'healthy', warn: 'degraded', error: 'critical' };
        return '<span class="badge badge-' + (m[l] || 'unknown') + '">' + l + '</span>';
    }

    function truncId(id) { return id ? id.substring(0, 10) : '--'; }
    function truncSha(s) { return s ? s.substring(0, 7) : '--'; }
    function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

    // ── Data fetching ──
    async function refreshOverview() {
        try {
            const [status, deps, events, incidents, services] = await Promise.all([
                api('/api/status'), api('/api/deployments'), api('/api/events'),
                api('/api/incidents'), api('/api/services')
            ]);

            // Top bar
            const oBadge = document.getElementById('overall-badge');
            const oh = status.overall_health || 'UNKNOWN';
            oBadge.innerHTML = oh;
            oBadge.className = 'badge badge-' + oh.toLowerCase();
            document.getElementById('recovery-mode').textContent = status.recovery_mode || '--';
            const uptimeS = status.agent_uptime || 0;
            document.getElementById('uptime').textContent = uptimeS > 3600 ? Math.floor(uptimeS / 3600) + 'h ' + Math.floor((uptimeS % 3600) / 60) + 'm' : uptimeS > 60 ? Math.floor(uptimeS / 60) + 'm ' + (uptimeS % 60) + 's' : uptimeS + 's';
            syncRunButton(status.agent_running);

            // Current prod
            const cp = status.current_deployment;
            if (cp) {
                document.getElementById('ov-dep-id').textContent = truncId(cp.deployment_id);
                document.getElementById('ov-dep-url').textContent = cp.url || '--';
                document.getElementById('ov-commit').textContent = truncSha(cp.commit_sha);
                document.getElementById('ov-age').textContent = timeAgo(cp.created_at);
                document.getElementById('ov-latency').textContent = cp.avg_latency || '--';
                document.getElementById('ov-errrate').textContent = (cp.error_rate || 0) + '%';
            }

            document.getElementById('ov-incidents').textContent = status.active_incidents || 0;

            if (status.last_recovery) {
                document.getElementById('ov-recovery').innerHTML = esc(status.last_recovery.message) + '<div style="color:var(--text-dim);font-size:0.72rem;margin-top:0.25rem">' + fmtTime(status.last_recovery.created_at) + '</div>';
            }

            // Services
            const svcEl = document.getElementById('ov-services');
            const agentSvcs = [
                { service_name: 'Agent Worker', status: status.agent_running ? 'HEALTHY' : 'OFFLINE' },
                { service_name: 'Scheduler', status: status.agent_running ? 'HEALTHY' : 'OFFLINE' },
                { service_name: 'Recovery Engine', status: status.recovery_mode === 'dry-run' ? 'DRY-RUN' : 'ARMED' },
            ];
            const allSvcs = [...agentSvcs, ...(services || [])];
            if (allSvcs.length > 0) {
                svcEl.innerHTML = allSvcs.map(s => {
                    const st = s.status || 'UNKNOWN';
                    const dotClass = st === 'HEALTHY' ? 'healthy' : st === 'DEGRADED' ? 'degraded' : st === 'CRITICAL' ? 'critical' : st === 'ARMED' ? 'armed' : st === 'DRY-RUN' ? 'degraded' : 'unknown';
                    return '<div class="svc-row"><span>' + esc(s.service_name) + '</span><span class="svc-status"><span class="dot dot-' + dotClass + '"></span>' + st + '</span></div>';
                }).join('');
            }

            // Feed
            const feedEl = document.getElementById('ov-feed');
            if (events && events.length > 0) {
                feedEl.innerHTML = events.slice(0, 30).map(e => '<div class="feed-item"><div class="feed-time">' + fmtTime(e.created_at) + '</div><div><div class="feed-msg">' + esc(e.message) + '</div>' + (e.deployment_id ? '<div class="feed-dep">' + e.deployment_id + '</div>' : '') + '</div></div>').join('');
            } else { feedEl.innerHTML = '<div class="empty">No events yet.</div>'; }

            // Deployments table
            const depsEl = document.getElementById('ov-deps');
            if (deps && deps.length > 0) {
                depsEl.innerHTML = deps.slice(0, 8).map(d => '<tr><td class="mono">' + truncId(d.deployment_id) + '</td><td class="mono" style="color:var(--text-dim)">' + truncSha(d.commit_sha) + '</td><td>' + statusBadge(d.status) + '</td><td>' + healthDot(d.health_status) + (d.health_status || '--') + '</td><td>' + (d.is_known_good ? '✓' : '—') + '</td><td style="color:var(--text-dim)">' + timeAgo(d.created_at) + '</td></tr>').join('');
            }

            // Active incidents
            const incEl = document.getElementById('ov-incidents-list');
            const active = (incidents || []).filter(i => ['DETECTED', 'INVESTIGATING', 'RECOVERING', 'MANUAL_INTERVENTION_REQUIRED'].includes(i.status));
            if (active.length > 0) {
                incEl.innerHTML = active.map(i => '<div class="incident-item"><div class="incident-header"><span class="badge badge-critical">INCIDENT ' + truncId(i.id) + '</span>' + healthBadge(i.status) + '</div><div class="incident-meta"><span>Deployment: <span class="mono">' + esc(i.deployment_id) + '</span></span><span>Detected: ' + fmtTime(i.detected_at) + '</span><span>Severity: ' + (i.severity || '--') + '</span></div><div class="incident-summary">' + esc(i.summary || 'Awaiting analysis...') + '</div></div>').join('');
            } else {
                incEl.innerHTML = '<div class="empty"><span class="dot dot-healthy"></span> No active incidents. Production is stable.</div>';
            }
        } catch (e) { console.error('Overview fetch error:', e); }
    }

    async function refreshHealth() {
        try {
            const [checks, status] = await Promise.all([api('/api/health_checks?limit=50'), api('/api/status')]);

            const cp = status.current_deployment;
            if (cp) {
                document.getElementById('h-status').textContent = cp.health_status || '--';
                document.getElementById('h-url').textContent = cp.url ? 'https://' + cp.url + '/api/health' : '--';
                document.getElementById('h-latency').textContent = cp.avg_latency || '--';
            }

            if (checks && checks.length > 0) {
                const success = checks.filter(c => c.is_successful).length;
                document.getElementById('h-success').textContent = Math.round((success / checks.length) * 100);

                // Table
                document.getElementById('h-table').innerHTML = checks.slice(0, 30).map(c => '<tr><td class="mono" style="color:var(--text-dim)">' + fmtTime(c.checked_at) + '</td><td>' + (c.status_code || '--') + '</td><td class="mono">' + (c.latency_ms || '--') + 'ms</td><td>' + (c.is_successful ? '<span style="color:var(--healthy)">PASS</span>' : '<span style="color:var(--critical)">FAIL</span>') + '</td><td style="color:var(--text-dim);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(c.error_message || '') + '</td></tr>').join('');
            }
        } catch (e) { console.error('Health error:', e); }
    }

    // Chart time range
    let chartMinutes = 60;
    document.querySelectorAll('.time-pills .pill[data-min]').forEach(p => p.addEventListener('click', async () => {
        document.querySelectorAll('.time-pills .pill[data-min]').forEach(x => x.classList.remove('active'));
        p.classList.add('active');
        chartMinutes = parseInt(p.dataset.min);
        await refreshChart();
    }));

    async function refreshChart() {
        try {
            const data = await api('/api/health_checks/chart?minutes=' + chartMinutes);
            const cont = document.getElementById('h-chart');
            if (!data || data.length === 0) { cont.innerHTML = '<div class="empty">No data for this range.</div>'; return; }
            const maxLat = Math.max(...data.map(d => d.latency_ms || 0), 1);
            cont.innerHTML = data.map(d => {
                const h = Math.max(2, ((d.latency_ms || 0) / maxLat) * 160);
                const cls = d.is_successful ? '' : ' error';
                return '<div class="chart-bar' + cls + '" style="height:' + h + 'px" title="' + (d.latency_ms || 0) + 'ms - ' + fmtTime(d.checked_at) + '"></div>';
            }).join('');
        } catch (e) { console.error('Chart error:', e); }
    }

    async function refreshDeployments() {
        try {
            const deps = await api('/api/deployments');
            const tbody = document.getElementById('dep-table');
            if (deps && deps.length > 0) {
                tbody.innerHTML = deps.map(d => '<tr><td class="mono">' + truncId(d.deployment_id) + '</td><td class="mono" style="color:var(--text-dim);max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(d.url) + '</td><td class="mono" style="color:var(--text-dim)">' + truncSha(d.commit_sha) + '</td><td style="color:var(--text-dim)">' + esc(d.branch || '--') + '</td><td>' + statusBadge(d.status) + '</td><td>' + healthDot(d.health_status) + (d.health_status || '--') + '</td><td class="mono">' + (d.error_rate || 0) + '%</td><td>' + (d.is_known_good ? '<span style="color:var(--healthy)">✓ Yes</span>' : '<span style="color:var(--text-dim)">—</span>') + '</td><td>' + (d.rolled_back_at ? '<span style="color:var(--critical)">Rolled back</span>' : '—') + '</td><td style="color:var(--text-dim)">' + timeAgo(d.created_at) + '</td></tr>').join('');
            }
        } catch (e) { console.error('Deployments error:', e); }
    }

    async function refreshIncidents() {
        try {
            const data = await api('/api/incidents');
            const el = document.getElementById('inc-list');
            if (data && data.length > 0) {
                el.innerHTML = data.map(i => {
                    const badgeCls = i.status === 'RECOVERED' ? 'badge-healthy' : i.status === 'RECOVERING' ? 'badge-recovering' : i.status === 'MANUAL_INTERVENTION_REQUIRED' ? 'badge-critical' : 'badge-degraded';
                    const duration = i.resolved_at ? Math.floor((new Date(i.resolved_at) - new Date(i.detected_at)) / 1000) + 's' : 'ongoing';
                    return '<div class="incident-item" style="' + (i.status === 'RECOVERED' ? 'border-color:rgba(34,197,94,0.15);background:rgba(34,197,94,0.03)' : '') + '"><div class="incident-header"><div><span class="badge ' + badgeCls + '">' + esc(i.status) + '</span> <strong style="margin-left:0.5rem">' + esc(i.type) + '</strong></div><span class="badge badge-' + (i.severity === 'critical' ? 'critical' : 'degraded') + '">' + (i.severity || '--') + '</span></div><div class="incident-meta"><span>ID: <span class="mono">' + truncId(i.id) + '</span></span><span>Deployment: <span class="mono">' + esc(i.deployment_id || '--') + '</span></span><span>Detected: ' + fmtTime(i.detected_at) + '</span><span>Duration: ' + duration + '</span></div>' + (i.root_cause ? '<div class="incident-summary"><strong>Cause:</strong> ' + esc(i.root_cause) + '</div>' : '') + (i.summary ? '<div class="incident-summary" style="margin-top:0.5rem">' + esc(i.summary) + '</div>' : '') + (i.actions_taken ? '<div class="incident-summary" style="margin-top:0.5rem"><strong>Actions:</strong> ' + esc(JSON.stringify(i.actions_taken)) + '</div>' : '') + '</div>';
                }).join('');
            } else { el.innerHTML = '<div class="empty">No incidents recorded.</div>'; }
        } catch (e) { console.error('Incidents error:', e); }
    }

    function applyToggles(settings) {
        document.querySelectorAll('.toggle[data-key]').forEach((btn) => {
            const on = !!(settings && settings[btn.dataset.key]);
            btn.classList.toggle('on', on);
            btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        syncRunButton(settings && settings.agent_running);
        const warn = document.getElementById('settings-warn');
        if (warn) warn.style.display = settings && settings.persisted === false ? 'block' : 'none';
    }

    function syncRunButton(running) {
        const btn = document.getElementById('agent-run-btn');
        if (!btn) return;
        if (running) {
            btn.textContent = 'STOP';
            btn.className = 'ctrl-btn ctrl-btn-stop';
        } else {
            btn.textContent = 'START';
            btn.className = 'ctrl-btn ctrl-btn-start';
        }
        btn.dataset.running = running ? '1' : '0';
    }

    document.getElementById('agent-run-btn').addEventListener('click', async () => {
        const btn = document.getElementById('agent-run-btn');
        const running = btn.dataset.running === '1';
        try {
            await api(running ? '/api/agent/stop' : '/api/agent/start', { method: 'POST', body: {} });
            await refreshAll();
        } catch (e) { console.error('Agent start/stop failed', e); }
    });

    document.querySelectorAll('.toggle[data-key]').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const key = btn.dataset.key;
            const next = !btn.classList.contains('on');
            try {
                const settings = await api('/api/settings', { method: 'PATCH', body: { [key]: next } });
                applyToggles(settings);
                await refreshAgent();
            } catch (e) {
                const warn = document.getElementById('settings-warn');
                if (warn) {
                    warn.style.display = 'block';
                    warn.textContent = e.message || 'Failed to update setting. Apply migrations/003_agent_settings.sql first.';
                }
            }
        });
    });

    async function refreshAgent() {
        try {
            const data = await api('/api/agent');
            applyToggles(data.settings);
            const svcEl = document.getElementById('ag-services');
            if (data.services) {
                svcEl.innerHTML = data.services.map(s => {
                    const dotCls = s.status === 'RUNNING' ? 'running' : s.status === 'ARMED' ? 'armed' : s.status === 'DRY-RUN' ? 'degraded' : s.status === 'STOPPED' || s.status === 'OFF' ? 'offline' : 'offline';
                    return '<div class="svc-row"><span>' + esc(s.name) + '</span><span class="svc-status"><span class="dot dot-' + dotCls + '"></span><span class="mono">' + s.status + '</span></span></div>';
                }).join('');
            }
            const statsEl = document.getElementById('ag-stats');
            const upH = Math.floor(data.uptime_seconds / 3600);
            const upM = Math.floor((data.uptime_seconds % 3600) / 60);
            statsEl.innerHTML = [
                ['Uptime', upH + 'h ' + upM + 'm'],
                ['Agent', data.settings && data.settings.agent_running ? 'RUNNING' : 'STOPPED'],
                ['Jobs Processed Today', data.jobs_processed_today],
                ['Jobs Failed Today', data.jobs_failed_today],
                ['Jobs Running', data.jobs_running],
                ['Recovery Mode', data.recovery_mode],
                ['Started At', fmtTime(data.started_at)]
            ].map(([k, v]) => '<div class="svc-row"><span>' + k + '</span><span class="mono" style="color:var(--text-secondary)">' + v + '</span></div>').join('');
        } catch (e) { console.error('Agent error:', e); }
    }

    async function refreshJobs() {
        try {
            const data = await api('/api/jobs');
            document.getElementById('jq-pending').textContent = data.counts.pending || 0;
            document.getElementById('jq-running').textContent = data.counts.locked || 0;
            document.getElementById('jq-completed').textContent = data.counts.completed || 0;
            document.getElementById('jq-failed').textContent = data.counts.failed || 0;

            const tbody = document.getElementById('jq-table');
            if (data.jobs && data.jobs.length > 0) {
                tbody.innerHTML = data.jobs.slice(0, 30).map(j => '<tr><td class="mono">' + truncId(j.id) + '</td><td class="mono">' + esc(j.job_type) + '</td><td>' + jobBadge(j.status) + '</td><td>' + j.attempts + '/' + j.max_attempts + '</td><td style="color:var(--text-dim);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(j.last_error || '') + '</td><td style="color:var(--text-dim)">' + timeAgo(j.created_at) + '</td></tr>').join('');
            }
        } catch (e) { console.error('Jobs error:', e); }
    }

    let logLevel = '';
    document.querySelectorAll('.log-filter').forEach(p => p.addEventListener('click', () => {
        document.querySelectorAll('.log-filter').forEach(x => x.classList.remove('active'));
        p.classList.add('active');
        logLevel = p.dataset.level;
        refreshLogs();
    }));

    async function refreshLogs() {
        try {
            const data = await api('/api/logs?limit=100' + (logLevel ? '&level=' + logLevel : ''));
            const tbody = document.getElementById('log-table');
            if (data && data.length > 0) {
                tbody.innerHTML = data.map(l => '<tr><td class="mono" style="color:var(--text-dim);white-space:nowrap">' + fmtTime(l.created_at) + '</td><td>' + levelBadge(l.level) + '</td><td class="mono">' + esc(l.event) + '</td><td style="color:var(--text-secondary)">' + esc(l.message) + '</td></tr>').join('');
            } else { tbody.innerHTML = '<tr><td colspan="4" class="empty">No logs found.</td></tr>'; }
        } catch (e) { console.error('Logs error:', e); }
    }

    // ── Refresh logic ──
    function getActivePage() {
        const active = document.querySelector('.nav-item.active');
        return active ? active.dataset.page : 'overview';
    }

    async function refreshAll() {
        const pg = getActivePage();
        if (pg === 'overview') { await refreshOverview(); }
        else if (pg === 'health') { await refreshHealth(); await refreshChart(); }
        else if (pg === 'deployments') { await refreshDeployments(); }
        else if (pg === 'incidents') { await refreshIncidents(); }
        else if (pg === 'agent') { await refreshAgent(); }
        else if (pg === 'jobs') { await refreshJobs(); }
        else if (pg === 'logs') { await refreshLogs(); }
        else if (pg === 'console') { /* keep existing output */ }
    }

    const consoleOut = document.getElementById('console-out');
    const consoleIn = document.getElementById('console-in');

    async function runConsoleCommand() {
        const command = consoleIn.value.trim();
        if (!command) return;
        consoleOut.textContent += '\n> ' + command;
        consoleIn.value = '';
        try {
            const result = await api('/api/console', { method: 'POST', body: { command } });
            consoleOut.textContent += '\n' + (result.message || JSON.stringify(result));
            applyToggles(result.settings);
        } catch (e) {
            consoleOut.textContent += '\n' + (e.message || 'Command failed');
        }
        consoleOut.scrollTop = consoleOut.scrollHeight;
        await refreshAll();
    }

    document.getElementById('console-run').addEventListener('click', runConsoleCommand);
    consoleIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') runConsoleCommand(); });

    // ── Boot ──
    checkAuth();
    refreshAll();
    setInterval(refreshAll, 4000);
})();

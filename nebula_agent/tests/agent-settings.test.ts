import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/storage/db', () => ({ db: {} }));
vi.mock('../src/utils/logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { defaultSettings, formatSettings } from '../src/storage/agent-settings';

describe('agent settings helpers', () => {
    it('defaults GitHub off and other safety switches on', () => {
        const prev = process.env.AGENT_ENABLED;
        process.env.AGENT_ENABLED = 'true';
        const settings = defaultSettings();
        expect(settings.github_enabled).toBe(false);
        expect(settings.vercel_enabled).toBe(true);
        expect(settings.health_enabled).toBe(true);
        expect(settings.ai_enabled).toBe(true);
        expect(settings.agent_running).toBe(true);
        process.env.AGENT_ENABLED = prev;
    });

    it('formats a compact status block', () => {
        const text = formatSettings({
            github_enabled: true,
            vercel_enabled: false,
            health_enabled: true,
            ai_enabled: false,
            agent_running: true,
            updated_at: null,
            updated_by: null,
            persisted: true,
        });
        expect(text).toContain('agent=RUNNING');
        expect(text).toContain('github=ON');
        expect(text).toContain('vercel=OFF');
        expect(text).toContain('ai=OFF');
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/storage/db', () => ({ db: {} }));
vi.mock('../src/utils/logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const settingsState = {
    github_enabled: false,
    vercel_enabled: true,
    health_enabled: true,
    ai_enabled: true,
    agent_running: true,
    updated_at: null,
    updated_by: null,
};

vi.mock('../src/storage/agent-settings', async () => {
    const actual = await vi.importActual<typeof import('../src/storage/agent-settings')>('../src/storage/agent-settings');
    return {
        ...actual,
        getSettings: vi.fn(async () => ({ ...settingsState })),
        updateSettings: vi.fn(async (patch: any, updatedBy: string) => {
            Object.assign(settingsState, patch, { updated_by: updatedBy, updated_at: new Date().toISOString() });
            return { ...settingsState };
        }),
    };
});

import { executeControlCommand, parseBoolToken } from '../src/control/commands';

describe('parseBoolToken', () => {
    it('accepts on/off aliases', () => {
        expect(parseBoolToken('on')).toBe(true);
        expect(parseBoolToken('enable')).toBe(true);
        expect(parseBoolToken('off')).toBe(false);
        expect(parseBoolToken('disable')).toBe(false);
        expect(parseBoolToken('maybe')).toBeNull();
    });
});

describe('executeControlCommand', () => {
    beforeEach(() => {
        Object.assign(settingsState, {
            github_enabled: false,
            vercel_enabled: true,
            health_enabled: true,
            ai_enabled: true,
            agent_running: true,
            updated_at: null,
            updated_by: null,
            persisted: false,
        });
    });

    it('starts and stops the agent', async () => {
        const stop = await executeControlCommand('stop', 'test');
        expect(stop.ok).toBe(true);
        expect(stop.settings?.agent_running).toBe(false);

        const start = await executeControlCommand('start', 'test');
        expect(start.settings?.agent_running).toBe(true);
    });

    it('toggles feature switches', async () => {
        const github = await executeControlCommand('github on', 'test');
        expect(github.ok).toBe(true);
        expect(github.settings?.github_enabled).toBe(true);

        const vercel = await executeControlCommand('vercel off', 'test');
        expect(vercel.settings?.vercel_enabled).toBe(false);

        const health = await executeControlCommand('health off', 'test');
        expect(health.settings?.health_enabled).toBe(false);

        const ai = await executeControlCommand('ai off', 'test');
        expect(ai.settings?.ai_enabled).toBe(false);
    });

    it('returns help and rejects unknown commands', async () => {
        const help = await executeControlCommand('help', 'test');
        expect(help.ok).toBe(true);
        expect(help.message).toContain('github on|off');

        const unknown = await executeControlCommand('explode', 'test');
        expect(unknown.ok).toBe(false);
    });
});

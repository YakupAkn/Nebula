import { db } from './db';
import { logger } from '../utils/logger';

export const SETTINGS_ID = 'default';

export const SETTING_KEYS = [
    'github_enabled',
    'vercel_enabled',
    'health_enabled',
    'ai_enabled',
    'agent_running',
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

export interface AgentSettings {
    github_enabled: boolean;
    vercel_enabled: boolean;
    health_enabled: boolean;
    ai_enabled: boolean;
    agent_running: boolean;
    updated_at: string | null;
    updated_by: string | null;
    persisted: boolean;
}

export function defaultSettings(): AgentSettings {
    return {
        github_enabled: false,
        vercel_enabled: true,
        health_enabled: true,
        ai_enabled: true,
        agent_running: process.env.AGENT_ENABLED === 'true',
        updated_at: null,
        updated_by: null,
        persisted: false,
    };
}

function rowToSettings(row: Partial<AgentSettings> | null | undefined): AgentSettings {
    const defaults = defaultSettings();
    if (!row) return defaults;
    return {
        github_enabled: row.github_enabled ?? defaults.github_enabled,
        vercel_enabled: row.vercel_enabled ?? defaults.vercel_enabled,
        health_enabled: row.health_enabled ?? defaults.health_enabled,
        ai_enabled: row.ai_enabled ?? defaults.ai_enabled,
        agent_running: row.agent_running ?? defaults.agent_running,
        updated_at: row.updated_at ?? null,
        updated_by: row.updated_by ?? null,
        persisted: true,
    };
}

let cache: { settings: AgentSettings; loadedAt: number } | null = null;
const CACHE_MS = 1500;
let lastLoadWarnMs = 0;

export function invalidateSettingsCache() {
    cache = null;
}

export async function getSettings(force = false): Promise<AgentSettings> {
    if (!force && cache && Date.now() - cache.loadedAt < CACHE_MS) {
        return cache.settings;
    }

    const { data, error } = await db
        .from('agent_settings')
        .select('*')
        .eq('id', SETTINGS_ID)
        .maybeSingle();

    if (error) {
        if (Date.now() - lastLoadWarnMs > 60000) {
            lastLoadWarnMs = Date.now();
            await logger.warn('agent_settings', `Failed to load settings: ${error.message}`);
        }
        const fallback = defaultSettings();
        cache = { settings: fallback, loadedAt: Date.now() };
        return fallback;
    }

    if (!data) {
        const seeded = defaultSettings();
        const { data: inserted, error: insertError } = await db
            .from('agent_settings')
            .insert({
                id: SETTINGS_ID,
                github_enabled: seeded.github_enabled,
                vercel_enabled: seeded.vercel_enabled,
                health_enabled: seeded.health_enabled,
                ai_enabled: seeded.ai_enabled,
                agent_running: seeded.agent_running,
                updated_by: 'bootstrap',
            })
            .select()
            .single();

        if (insertError) {
            await logger.warn('agent_settings', `Failed to seed settings: ${insertError.message}`);
            cache = { settings: seeded, loadedAt: Date.now() };
            return seeded;
        }

        const settings = rowToSettings(inserted);
        cache = { settings, loadedAt: Date.now() };
        return settings;
    }

    const settings = rowToSettings(data);
    cache = { settings, loadedAt: Date.now() };
    return settings;
}

export async function isEnabled(key: SettingKey): Promise<boolean> {
    const settings = await getSettings();
    return settings[key];
}

export async function updateSettings(
    patch: Partial<Pick<AgentSettings, SettingKey>>,
    updatedBy: string
): Promise<AgentSettings> {
    const allowed: Partial<Record<SettingKey, boolean>> = {};
    for (const key of SETTING_KEYS) {
        if (typeof patch[key] === 'boolean') {
            allowed[key] = patch[key];
        }
    }

    if (Object.keys(allowed).length === 0) {
        return getSettings(true);
    }

    await getSettings(true);

    const { data, error } = await db
        .from('agent_settings')
        .update({
            ...allowed,
            updated_at: new Date().toISOString(),
            updated_by: updatedBy,
        })
        .eq('id', SETTINGS_ID)
        .select()
        .single();

    if (error || !data) {
        throw new Error(error?.message || 'Failed to update agent_settings');
    }

    const settings = rowToSettings(data);
    cache = { settings, loadedAt: Date.now() };

    const changed = Object.entries(allowed)
        .map(([k, v]) => `${k}=${v ? 'ON' : 'OFF'}`)
        .join(', ');
    await logger.info('agent_settings', `Settings updated by ${updatedBy}: ${changed}`);

    return settings;
}

export function formatSettings(settings: AgentSettings): string {
    return [
        `agent=${settings.agent_running ? 'RUNNING' : 'STOPPED'}`,
        `github=${settings.github_enabled ? 'ON' : 'OFF'}`,
        `vercel=${settings.vercel_enabled ? 'ON' : 'OFF'}`,
        `health=${settings.health_enabled ? 'ON' : 'OFF'}`,
        `ai=${settings.ai_enabled ? 'ON' : 'OFF'}`,
        settings.updated_by ? `updated_by=${settings.updated_by}` : null,
        settings.updated_at ? `updated_at=${settings.updated_at}` : null,
    ]
        .filter(Boolean)
        .join('\n');
}

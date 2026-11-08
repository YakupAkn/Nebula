import { AgentSettings, formatSettings, getSettings, SettingKey, updateSettings } from '../storage/agent-settings';

export interface CommandResult {
    ok: boolean;
    message: string;
    settings?: AgentSettings;
}

const HELP = [
    'Commands:',
    '  status',
    '  start | stop',
    '  github on|off',
    '  vercel on|off',
    '  health on|off',
    '  ai on|off',
    '  help',
].join('\n');

const FEATURE_KEYS: Record<string, SettingKey> = {
    github: 'github_enabled',
    vercel: 'vercel_enabled',
    health: 'health_enabled',
    ai: 'ai_enabled',
};

export function parseBoolToken(token: string | undefined): boolean | null {
    if (!token) return null;
    const t = token.toLowerCase();
    if (['on', 'true', '1', 'enable', 'enabled', 'start'].includes(t)) return true;
    if (['off', 'false', '0', 'disable', 'disabled', 'stop'].includes(t)) return false;
    return null;
}

export async function executeControlCommand(raw: string, actor: string): Promise<CommandResult> {
    const parts = raw.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
        return { ok: false, message: 'Empty command. Type help.' };
    }

    const verb = parts[0].toLowerCase();
    const arg = parts[1]?.toLowerCase();

    if (verb === 'help' || verb === '?') {
        return { ok: true, message: HELP };
    }

    if (verb === 'status') {
        const settings = await getSettings(true);
        return { ok: true, message: formatSettings(settings), settings };
    }

    if (verb === 'start' || (verb === 'agent' && arg === 'start')) {
        const settings = await updateSettings({ agent_running: true }, actor);
        return { ok: true, message: 'Agent STARTED', settings };
    }

    if (verb === 'stop' || (verb === 'agent' && arg === 'stop')) {
        const settings = await updateSettings({ agent_running: false }, actor);
        return { ok: true, message: 'Agent STOPPED', settings };
    }

    const feature = FEATURE_KEYS[verb];
    if (feature) {
        const value = parseBoolToken(arg);
        if (value === null) {
            return { ok: false, message: `Usage: ${verb} on|off` };
        }
        const settings = await updateSettings({ [feature]: value }, actor);
        return {
            ok: true,
            message: `${verb} ${value ? 'ON' : 'OFF'}`,
            settings,
        };
    }

    return { ok: false, message: `Unknown command: ${raw.trim()}\n${HELP}` };
}

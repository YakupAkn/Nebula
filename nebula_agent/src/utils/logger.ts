import { db } from '../storage/db';

export const logger = {
    info: async (event: string, message: string, metadata?: any, run_id?: string) => {
        console.log(`[INFO] ${event}: ${message}`);
        await logToDb('info', event, message, metadata, run_id);
    },
    error: async (event: string, message: string, metadata?: any, run_id?: string) => {
        console.error(`[ERROR] ${event}: ${message}`, metadata);
        await logToDb('error', event, message, metadata, run_id);
    },
    warn: async (event: string, message: string, metadata?: any, run_id?: string) => {
        console.warn(`[WARN] ${event}: ${message}`);
        await logToDb('warn', event, message, metadata, run_id);
    }
};

async function logToDb(level: string, event: string, message: string, metadata: any, run_id?: string) {
    // Avoid secrets from accidentally leaking (rudimentary filter)
    const safeMetadata = metadata ? JSON.parse(JSON.stringify(metadata).replace(/(token|key|password)[^"]*":"[^"]*"/gi, '$1":"***"')) : null;
    try {
        await db.from('agent_logs').insert({
            level,
            event,
            message,
            metadata: safeMetadata,
            run_id: run_id || null
        });
    } catch (e) {
        console.error('Failed to write log to DB:', e);
    }
}

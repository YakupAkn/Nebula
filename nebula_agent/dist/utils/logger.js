"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const db_1 = require("../storage/db");
exports.logger = {
    info: async (event, message, metadata, run_id) => {
        console.log(`[INFO] ${event}: ${message}`);
        await logToDb('info', event, message, metadata, run_id);
    },
    error: async (event, message, metadata, run_id) => {
        console.error(`[ERROR] ${event}: ${message}`, metadata);
        await logToDb('error', event, message, metadata, run_id);
    },
    warn: async (event, message, metadata, run_id) => {
        console.warn(`[WARN] ${event}: ${message}`);
        await logToDb('warn', event, message, metadata, run_id);
    }
};
async function logToDb(level, event, message, metadata, run_id) {
    // Avoid secrets from accidentally leaking (rudimentary filter)
    const safeMetadata = metadata ? JSON.parse(JSON.stringify(metadata).replace(/(token|key|password)[^"]*":"[^"]*"/gi, '$1":"***"')) : null;
    try {
        await db_1.db.from('agent_logs').insert({
            level,
            event,
            message,
            metadata: safeMetadata,
            run_id: run_id || null
        });
    }
    catch (e) {
        console.error('Failed to write log to DB:', e);
    }
}

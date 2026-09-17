import * as dotenv from 'dotenv';
dotenv.config();

import { AgentRunner } from './core/agent-runner';

async function bootstrap() {
    if (process.env.AGENT_ENABLED !== 'true') {
        console.warn('Agent is disabled. Set AGENT_ENABLED=true in .env to start processing.');
        process.exit(0);
    }

    try {
        const runner = new AgentRunner();
        await runner.start();

        console.log('Worker is now polling and waiting for jobs.');

        // Graceful termination
        process.on('SIGINT', () => {
            console.log('\nReceived SIGINT. Shutting down gracefully...');
            process.exit(0);
        });

    } catch (e) {
        console.error('Failed to start worker:', e);
        process.exit(1);
    }
}

bootstrap();

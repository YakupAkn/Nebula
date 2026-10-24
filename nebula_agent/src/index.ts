import * as dotenv from 'dotenv';
dotenv.config();

import { AgentRunner } from './core/agent-runner';

async function bootstrap() {
    try {
        const { DashboardServer } = await import('./dashboard/server');
        const dashboard = new DashboardServer();
        dashboard.start();

        const runner = new AgentRunner();
        await runner.start();

        console.log('Control plane is up. Worker honors agent_settings (START/STOP and feature switches).');

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

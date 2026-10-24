import * as dotenv from 'dotenv';
dotenv.config();

import { executeControlCommand } from '../control/commands';

async function main() {
    const command = process.argv.slice(2).join(' ').trim();
    if (!command) {
        console.log('Usage: npm run ctl -- <command>');
        console.log('Example: npm run ctl -- status');
        process.exit(1);
    }

    const result = await executeControlCommand(command, 'cli');
    console.log(result.message);
    process.exit(result.ok ? 0 : 1);
}

main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
});

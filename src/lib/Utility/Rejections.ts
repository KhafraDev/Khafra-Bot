import { client as DiscordClient } from '#khaf/Client';
import { sql as PostgresClient } from '#khaf/database/Postgres.js';
import { logger } from '#khaf/Logger';
import Graceful from 'node-graceful';
import { exit } from 'node:process';

Graceful.captureExceptions = true;

Graceful.on('exit', async (reason, promise) => {
    logger.error(reason, promise);

    await PostgresClient.end({ timeout: 5 });
    DiscordClient.destroy();
    logger.close();

    exit(1);
});
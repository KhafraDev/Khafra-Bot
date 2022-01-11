import { client as DiscordClient } from '#khaf/Client';
import { sql as PostgresClient } from '#khaf/database/Postgres.js';
import { client as RedisClient } from '#khaf/database/Redis.js';
import { db as SQLiteClient } from '#khaf/database/SQLite.js';
import { logger } from '#khaf/Logger';
import Graceful from 'node-graceful';
import { exit } from 'process';

Graceful.captureExceptions = true;

Graceful.on('exit', async (reason, promise) => {
    logger.error(reason, promise);

    await RedisClient.exit();
    await PostgresClient.end({ timeout: 5 });
    DiscordClient.destroy();
    SQLiteClient.close();
    logger.close();

    exit(1);
});
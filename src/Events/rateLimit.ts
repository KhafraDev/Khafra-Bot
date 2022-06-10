import { Event } from '#khaf/Event';
import { logger } from '#khaf/structures/Logger/FileLogger.js';
import type { RateLimitData } from '@discordjs/rest';

export class kEvent extends Event<'rateLimited'> {
    name = 'rateLimited' as const;

    async init (data: RateLimitData): Promise<void> {
        logger.warn(data, 'ratelimit');
    }
}
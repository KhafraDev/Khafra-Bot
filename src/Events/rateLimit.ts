import { Event } from '#khaf/Event';
import { logger } from '#khaf/Logger';
import type { RateLimitData } from 'discord.js';

export class kEvent extends Event<'rateLimit'> {
    name = 'rateLimit' as const;

    async init(data: RateLimitData) {
        logger.warn(data);
    }
}
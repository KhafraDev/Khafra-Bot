import { Event } from '#khaf/Event';
import { logger } from '#khaf/Logger';
import type { RateLimitData } from '@discordjs/rest';

export class kEvent extends Event<'rateLimited'> {
    name = 'rateLimited' as const;

    async init(data: RateLimitData) {
        logger.warn(data);
    }
}
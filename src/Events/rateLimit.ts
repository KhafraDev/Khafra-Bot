import { Event } from '../Structures/Event.js';
import { Logger } from '../Structures/Logger.js';
import type { RateLimitData } from 'discord.js';

const logger = new Logger();

export class kEvent extends Event<'rateLimit'> {
    name = 'rateLimit' as const;

    async init(data: RateLimitData) {
        logger.warn(data);
    }
}
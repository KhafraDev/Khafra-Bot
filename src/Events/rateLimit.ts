import { Event } from '../Structures/Event.js';
import { RegisterEvent } from '../Structures/Decorator.js';
import { Logger } from '../Structures/Logger.js';
import type { RateLimitData } from 'discord.js';

const logger = new Logger('WARN');

@RegisterEvent
export class kEvent extends Event<'rateLimit'> {
    name = 'rateLimit' as const;

    async init(data: RateLimitData) {
        logger.log(data);
    }
}
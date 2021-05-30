import { Event } from '../Structures/Event.js';
import { RegisterEvent } from '../Structures/Decorator.js';
import { Logger } from '../Structures/Logger.js';
import { trim } from '../lib/Utility/Template.js';
import type { RateLimitData } from 'discord.js';

const logger = new Logger('RateLimit');

@RegisterEvent
export class kEvent extends Event {
    name = 'rateLimit' as const;

    async init(data: RateLimitData) {
        logger.log(trim`
        Timeout: ${data.timeout} 
        | Limit: ${data.limit} 
        | HTTP Method: ${data.method} 
        | Route: ${data.route} 
        | Path: ${data.path}
        `);
    }
}
import { Message, EmojiResolvable } from 'discord.js';
import { Logger } from '../Logger.js';
import { trim } from '../../lib/Utility/Template.js';

const logger = new Logger('React Proxy');

Message.prototype.react = new Proxy(Message.prototype.react, {
    async apply(target, thisArg: Message, args: EmojiResolvable[]) {
        try {
            const m = await target.call(thisArg, args[0]);
            return m;
        } catch(e) {
            logger.log(trim`
            ID: "${thisArg.id}"
            | Message URL: "${thisArg.url}"
            | Reacting to User: "${thisArg.author.id}"
            | Error: "${e.toString()}"
            `);
            return null;
        }
    }
});
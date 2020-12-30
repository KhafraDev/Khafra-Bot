import { Message } from 'discord.js';
import { Logger } from '../Logger.js';
import { trim } from '../../lib/Utility/Template.js';

const logger = new Logger('Reply Proxy');

Message.prototype.reply = new Proxy(Message.prototype.reply, {
    async apply(target, thisArg, args): Promise<Message> {
        /**
         * Not sure if @see {Message#reply} throws errors as deliberately attempting
         * to cause errors has the original function return `null`.
         * This is just a precaution if the branch is changed to match the rest of the API,
         * or if checks are done before posting to the API.
         */
        try {
            return await target.apply(thisArg, args) as Message;
        } catch(e) {
            logger.log(trim`
            User: ${thisArg?.author?.id} (${thisArg?.author?.tag})
            | Channel: ${thisArg?.channel?.id} (${thisArg?.channel?.type})
            | Error: ${e}
            `);
            return null;
        }
    }
});
import { Message } from "discord.js";
import { Logger } from "../Logger.js";
import { trim } from "../../lib/Utility/Template.js";

const logger = new Logger('Edit Proxy');

type Parameters<T> = T extends (... args: infer T) => any ? T : never; 

Message.prototype.edit = new Proxy(Message.prototype.edit, {
    async apply(target, thisArg: Message, args: Parameters<Message['edit']>) {
        try {
            const m = await target.call(thisArg, ...args);
            return m;
        } catch(e) {
            logger.log(trim`
            Message Type: "${thisArg.type}"
            | Message ID: "${thisArg.id}"
            | URL: "${thisArg.url}"
            | User ID: "${thisArg.author.id}"
            | Error: "${e.toString()}"
            `);
            return null;
        }
    }
});
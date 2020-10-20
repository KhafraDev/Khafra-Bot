import { 
    TextChannel,
    Message,
    DMChannel,
    NewsChannel
} from "discord.js";
import { Logger } from "../Logger.js";
import { trim } from "../../lib/Utility/Template.js";

const logger = new Logger('ChannelSend Proxy');

type Parameters<T> = T extends (... args: infer T) => any ? T : never; 

TextChannel.prototype.send = new Proxy(TextChannel.prototype.send, {
    async apply(target, thisArg: TextChannel | DMChannel, args: Parameters<TextChannel['send']>) {
        try {
            const m = await target.call(thisArg, ...args) as Message;
            return m;
        } catch(e) {
            logger.log(trim`
            Channel Type: "${thisArg.type}"
            | Channel ID: "${thisArg.id}"
            | User ID: "${thisArg instanceof DMChannel ? thisArg.recipient.id : 'Not DMs'}"
            | Error: "${e.toString()}"
            `);
            return null;
        }
    }
});

DMChannel.prototype.send = TextChannel.prototype.send;
NewsChannel.prototype.send = NewsChannel.prototype.send;
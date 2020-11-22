import { 
    TextChannel,
    Message,
    DMChannel,
    NewsChannel
} from "discord.js";
import { Logger } from "../Logger.js";
import { trim } from "../../lib/Utility/Template.js";

const logger = new Logger('ChannelSend Proxy');

TextChannel.prototype.send = new Proxy(TextChannel.prototype.send, {
    async apply(target, thisArg: TextChannel | DMChannel, args) {
        try {
            return await target.apply(thisArg, args) as Message;
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
NewsChannel.prototype.send = TextChannel.prototype.send;
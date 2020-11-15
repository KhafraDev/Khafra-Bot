import { Command } from '../../Structures/Command.js';
import { 
    Message, 
    GuildChannel, 
    Channel, 
    TextChannel
} from 'discord.js';
import { getMentions, validSnowflake } from '../../lib/Utility/Mentions.js';
import ms from 'ms';

const isText = <T extends Channel>(c: T): c is T & TextChannel => c.type === 'text';
const MAX = ms('6h');

export default class extends Command {
    constructor() {
        super(
            [
                'Sets ratelimit in seconds.',
                '#general 6h',
                '543940496683434014 15s',
            ],
            [ 'MANAGE_CHANNELS' ],
            {
                name: 'ratelimit', 
                folder: 'Moderation',
                aliases: [ 'slowmode', 'slow-mode', 'rl' ],
                args: [1, 2],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        let idOrChannel = getMentions(message, args, { type: 'channels' });
        if(!idOrChannel || (typeof idOrChannel === 'string' && !validSnowflake(idOrChannel))) {
            idOrChannel = message.channel; 
        } else if(typeof idOrChannel === 'string') {
            idOrChannel = message.guild.channels.cache.get(idOrChannel);
        }

        if(!idOrChannel) { // just to be safe, shouldn't be possible
            return message.channel.send(this.Embed.generic('Invalid Channel!'));
        }

        const secs = (args.length === 2 ? ms(args[1]) : ms('0')) / 1000;
        const channel = idOrChannel as GuildChannel;
        if(!isText(channel)) {
            return message.channel.send(this.Embed.generic('No text channel found!'));
        } else if(!channel.permissionsFor(message.guild.me).has(this.permissions)) {
            // maybe better fail message?
            return message.channel.send(this.Embed.missing_perms());
        } else if(isNaN(secs) || secs > MAX) {
            return message.channel.send(this.Embed.fail('Invalid number of seconds (max is 6H)!'));
        }

        try {
            await channel.setRateLimitPerUser(
                secs,
                `Khafra-Bot: ${secs}s. rate-limit set by ${message.author.tag} (${message.author.id})`
            );
        } catch {
            return message.channel.send(this.Embed.fail(`
            An error occurred setting a slow-mode!
            `));
        }

        return message.channel.send(this.Embed.success(`
        Slow-mode set in ${channel} for ${secs} seconds!
        `));
    }
}
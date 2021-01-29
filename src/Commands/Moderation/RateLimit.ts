import { Command } from '../../Structures/Command.js';
import { 
    Message, 
    TextChannel,
    Permissions
} from 'discord.js';
import { _getMentions } from '../../lib/Utility/Mentions.js';
import ms from 'ms';
import { GuildSettings } from '../../lib/types/Collections.js';
import { isExplicitText } from '../../lib/types/Discord.js.js';

const MAX = ms('6h');

export default class extends Command {
    constructor() {
        super(
            [
                'Sets ratelimit in seconds.',
                '#general 6h',
                '543940496683434014 15s',
            ],
			{
                name: 'ratelimit', 
                folder: 'Moderation',
                aliases: [ 'slowmode', 'slow-mode', 'rl' ],
                args: [1, 2],
                guildOnly: true,
                permissions: [ Permissions.FLAGS.MANAGE_CHANNELS ]
            }
        );
    }

    async init(message: Message, args: string[], settings: GuildSettings) {
        const text = await _getMentions(message, 'channels') ?? message.channel;
        const secs = (args.length === 2 ? ms(args[1]) : ms('0')) / 1000;

        if(!isExplicitText(text)) {
            return message.reply(this.Embed.generic('No text channel found!'));
        } else if(!text.permissionsFor(message.guild.me).has(this.permissions)) {
            // maybe better fail message?
            return message.reply(this.Embed.missing_perms());
        } else if(isNaN(secs) || secs > MAX) {
            return message.reply(this.Embed.fail('Invalid number of seconds (max is 6H)!'));
        }

        try {
            await text.setRateLimitPerUser(
                secs,
                `Khafra-Bot: ${secs}s. rate-limit set by ${message.author.tag} (${message.author.id})`
            );
        } catch {
            return message.reply(this.Embed.fail(`
            An error occurred setting a slow-mode!
            `));
        }

        await message.reply(this.Embed.success(`
        Slow-mode set in ${text} for ${secs} seconds!
        `));

        if(typeof settings?.modActionLogChannel === 'string') {
            const channel = message.guild.channels.cache.get(settings.modActionLogChannel) as TextChannel;
            if(channel?.type !== 'text') {
                return;
            } else if(!channel.permissionsFor(message.guild.me).has([ 'SEND_MESSAGES', 'EMBED_LINKS' ])) {
                return;
            }

            return channel.send(this.Embed.success(`
            **Channel:** ${text} (${text.id}).
            **Staff:** ${message.member}
            `).setTitle('Channel Rate-Limited'));
        }
    }
}
import { Command } from '../../Structures/Command.js';
import { 
    Message, 
    GuildChannel, 
    Channel, 
    TextChannel, 
    NewsChannel,
    OverwriteData
} from 'discord.js';
import { getMentions, validSnowflake } from '../../lib/Utility/Mentions.js';
import { GuildSettings } from '../../lib/types/Collections.js';

const isText = <T extends Channel>(c: T): c is T & (TextChannel | NewsChannel) => c.type === 'text' || c.type === 'news';

export default class extends Command {
    constructor() {
        super(
            [
                'Disables @everyone from sending messages.',
                '#general',
                '543940496683434014',
                ''
            ],
            [ 'MANAGE_CHANNELS' ],
            {
                name: 'lock', 
                folder: 'Moderation',
                args: [0, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[], settings: GuildSettings) {
        let idOrChannel = getMentions(message, args, { type: 'channels' });
        if(!idOrChannel || (typeof idOrChannel === 'string' && !validSnowflake(idOrChannel))) {
            idOrChannel = message.channel; 
        } else if(typeof idOrChannel === 'string' && message.guild.channels.cache.has(idOrChannel)) {
            idOrChannel = message.guild.channels.cache.get(idOrChannel);
        }

        if(!idOrChannel) {
            return message.channel.send(this.Embed.generic('Invalid Channel!'));
        }

        const everyone = message.guild.roles.everyone;
        const text = idOrChannel as GuildChannel;
        if(!isText(text)) {
            return message.channel.send(this.Embed.generic('No channel found!'));
        } else if(!text.permissionsFor(message.guild.me).has(this.permissions)) {
            // maybe better fail message?
            return message.channel.send(this.Embed.missing_perms());
        }

        const opts: OverwriteData = {
            id: everyone
        };

        if(!text.permissionsFor(everyone).has([ 'SEND_MESSAGES' ])) {
            opts.allow = 'SEND_MESSAGES';
        } else {
            opts.deny = 'SEND_MESSAGES';
        }

        const lockState = `${'allow' in opts ? 'un' : ''}locked`;
        try {
            await text.overwritePermissions(
                [ opts ], 
                `${text.id} ${lockState} by ${message.author.tag} (${message.author.id})`
            );
        } catch {
            return message.channel.send(this.Embed.fail(`
            An error occurred creating permission overwrites in ${text}!
            `));
        }

        await message.channel.send(this.Embed.success(`
        ${text} has been ${lockState} for ${everyone}!
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
            `).setTitle('Channel Locked'));
        }
    }
}
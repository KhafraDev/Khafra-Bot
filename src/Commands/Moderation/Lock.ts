import { Command } from '../../Structures/Command.js';
import { 
    Message, 
    TextChannel, 
    OverwriteData,
    Permissions
} from 'discord.js';
import { _getMentions } from '../../lib/Utility/Mentions.js';
import { GuildSettings } from '../../lib/types/Collections.js';
import { isText } from '../../lib/types/Discord.js.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Disables @everyone from sending messages.',
                '#general',
                '543940496683434014',
                ''
            ],
			{
                name: 'lock', 
                folder: 'Moderation',
                args: [0, 1],
                guildOnly: true,
                permissions: [ Permissions.FLAGS.MANAGE_CHANNELS ]
            }
        );
    }

    async init(message: Message, _args: string[], settings: GuildSettings) {
        const text = await _getMentions(message, 'channels') ?? message.channel;
        const everyone = message.guild.roles.everyone;

        if(!isText(text)) {
            return message.reply(this.Embed.generic('No channel found!'));
        } else if(!text.permissionsFor(message.guild.me).has(this.permissions)) {
            // maybe better fail message?
            return message.reply(this.Embed.missing_perms());
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
            return message.reply(this.Embed.fail(`
            An error occurred creating permission overwrites in ${text}!
            `));
        }

        await message.reply(this.Embed.success(`
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
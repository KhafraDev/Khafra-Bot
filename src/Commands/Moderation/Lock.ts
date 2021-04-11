import { Command, Arguments } from '../../Structures/Command.js';
import { 
    Message, 
    TextChannel, 
    Permissions
} from 'discord.js';
import { getMentions } from '../../lib/Utility/Mentions.js';
import { GuildSettings } from '../../lib/types/Collections.js';
import { isText } from '../../lib/types/Discord.js.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
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

    async init(message: Message, _args: Arguments, settings: GuildSettings) {
        const text = await getMentions(message, 'channels') ?? message.channel;
        const everyone = message.guild.roles.everyone;

        if (!isText(text)) {
            return this.Embed.generic(this, 'No channel found!');
        } else if (!hasPerms(text, message.guild.me, this.permissions)) {
            // maybe better fail message?
            return this.Embed.missing_perms();
        }

        // TODO: test once https://github.com/discordjs/discord.js/pull/5251 is closed

        let lockState = 'unlocked';
        if (!hasPerms(text, everyone, Permissions.FLAGS.SEND_MESSAGES)) {
            await text.lockPermissions();
        } else {
            lockState = 'locked';
            await text.overwritePermissions(
                [ { id: everyone.id, deny: [Permissions.FLAGS.SEND_MESSAGES] } ]
            );
        }

        await message.reply(this.Embed.success(`
        ${text} has been ${lockState} for ${everyone}!
        `));

        if (typeof settings?.modActionLogChannel === 'string') {
            const channel = message.guild.channels.cache.get(settings.modActionLogChannel) as TextChannel;
            
            if (!hasPerms(channel, message.guild.me, [ Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS ]))
                return;

            return channel.send(this.Embed.success(`
            **Channel:** ${text} (${text.id}).
            **Staff:** ${message.member}
            `).setTitle('Channel Locked'));
        }
    }
}
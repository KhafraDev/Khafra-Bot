import { Command, Arguments } from '../../Structures/Command.js';
import { Permissions } from 'discord.js';
import { getMentions } from '../../lib/Utility/Mentions.js';
import { isText, Message } from '../../lib/types/Discord.js.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { kGuild } from '../../lib/types/KhafraBot.js';
import { bold } from '@discordjs/builders';

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

    async init(message: Message, _args: Arguments, settings: kGuild) {
        const text = await getMentions(message, 'channels') ?? message.channel;
        const everyone = message.guild.roles.everyone;

        if (!isText(text)) {
            return this.Embed.generic(this, 'No channel found!');
        } else if (!hasPerms(text, message.guild.me, this.permissions)) {
            // maybe better fail message?
            return this.Embed.missing_perms();
        }

        let lockState = 'unlocked';
        if (!hasPerms(text, everyone, Permissions.FLAGS.SEND_MESSAGES)) {
            await text.lockPermissions();
        } else {
            lockState = 'locked';
            await text.permissionOverwrites.set(
                [ { id: everyone.id, deny: [Permissions.FLAGS.SEND_MESSAGES] } ]
            );
        }

        await message.reply({ embeds: [this.Embed.success(`
        ${text} has been ${lockState} for ${everyone}!
        `)] });

        if (settings.mod_log_channel !== null) {
            const channel = message.guild.channels.cache.get(settings.mod_log_channel);
            
            if (!isText(channel) || !hasPerms(channel, message.guild.me, [ Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS ]))
                return;

            return void channel.send({ embeds: [this.Embed.success(`
            ${bold('Channel:')} ${text} (${text.id}).
            ${bold('Staff:')} ${message.member}
            `).setTitle('Channel Locked')] });
        }
    }
}
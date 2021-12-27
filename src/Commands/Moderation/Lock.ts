import { bold } from '@khaf/builders';
import { Message, Permissions } from 'discord.js';
import { isText } from '#khaf/utility/Discord.js';
import { kGuild } from '#khaf/types/KhafraBot.js';
import { getMentions } from '#khaf/utility/Mentions.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { Arguments, Command } from '#khaf/Command';

const perms = new Permissions([
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.EMBED_LINKS
]);

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

    async init(message: Message<true>, _args: Arguments, settings: kGuild) {
        const text = await getMentions(message, 'channels') ?? message.channel;
        const everyone = message.guild.roles.everyone;

        if (!isText(text)) {
            return this.Embed.generic(this, 'No channel found!');
        } else if (!hasPerms(text, message.guild.me, this.permissions)) {
            if (message.guild.me) {
                return this.Embed.perms(text, message.guild.me, this.permissions);
            } else {
                return this.Embed.error(`A caching issue prevented me from properly checking permissions!`);
            }
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

        await message.reply({ embeds: [this.Embed.ok(`
        ${text} has been ${lockState} for ${everyone}!
        `)] });

        if (settings.mod_log_channel !== null) {
            const channel = message.guild.channels.cache.get(settings.mod_log_channel);
            
            if (!isText(channel) || !hasPerms(channel, message.guild.me, perms))
                return;

            return void channel.send({ embeds: [this.Embed.ok(`
            ${bold('Channel:')} ${text} (${text.id}).
            ${bold('Staff:')} ${message.member}
            `).setTitle('Channel Locked')] });
        }
    }
}
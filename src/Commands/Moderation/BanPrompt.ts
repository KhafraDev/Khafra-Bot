import { Command, Arguments } from '../../Structures/Command.js';
import { Interaction, MessageActionRow, Permissions } from 'discord.js';
import { getMentions } from '../../lib/Utility/Mentions.js';
import { parseStrToMs } from '../../lib/Utility/ms.js';
import { hasPerms, hierarchy } from '../../lib/Utility/Permissions.js';
import { Range } from '../../lib/Utility/Valid/Number.js';
import { Components, disableAll } from '../../lib/Utility/Constants/Components.js';
import { bans } from '../../lib/Cache/Bans.js';
import { Message } from '../../lib/types/Discord.js.js';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';

const inRange = Range({ min: 0, max: 7, inclusive: true });

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Ban a member from the guild, prompts you for confirmation first.',
                '@user 3d for a good reason',
                '@user 0 bye!',
                '239566240987742220 7d'
            ],
			{
                name: 'banprompt', 
                folder: 'Moderation',
                aliases: [ 'bnaprompt' ],
                args: [1],
                guildOnly: true,
                permissions: [ Permissions.FLAGS.BAN_MEMBERS ]
            }
        );
    }

    async init(message: Message, { args }: Arguments) {
        const user = await getMentions(message, 'users');
        const clear = typeof args[1] === 'string' ? Math.ceil(parseStrToMs(args[1])! / 86400000) : 7;
        const reason = args.slice(args[1] && parseStrToMs(args[1]) ? 2 : 1).join(' ');

        const member = message.guild.members.resolve(user);
        if (member && !hierarchy(message.member, member)) {
            return this.Embed.error(`You do not have permission to ban ${member}!`);
        } else if (!user) {
            return this.Embed.error(`No user id or user mentioned, no one was banned.`);
        }

        const row = new MessageActionRow()
			.addComponents(
                Components.approve('Yes'),
                Components.deny('No')
            );

        const msg = await message.reply({
            embeds: [this.Embed.ok(`Are you sure you want to ban ${user}?`)],
            components: [row]
        });

        const filter = (interaction: Interaction) => 
            interaction.isMessageComponent() &&
            ['approve', 'deny'].includes(interaction.customId) && 
            interaction.user.id === message.author.id;

        const [pressedError, button] = await dontThrow(msg.awaitMessageComponent({
            filter, time: 20_000
        }));

        if (pressedError !== null) {
            return void msg.edit({
                embeds: [this.Embed.error(`Didn't get confirmation to ban ${user}!`)],
                components: []
            });
        }

        if (button.customId === 'deny')
            return void button.update({
                embeds: [this.Embed.error(`${user} gets off lucky... this time (command was canceled)!`)],
                components: []
            }); 

        await button.deferUpdate();

        const [banError] = await dontThrow(message.guild.members.ban(user, {
            days: inRange(clear) ? clear : 7,
            reason: reason.length > 0 ? reason : `Requested by ${message.member.id}`
        }));

        if (banError !== null) {
            return void button.editReply({
                embeds: [this.Embed.error(`${user} isn't bannable!`)],
                components: []
            });
        } else {
            if (hasPerms(message.channel, message.guild.me, Permissions.FLAGS.VIEW_AUDIT_LOG))
                if (!bans.has(`${message.guild.id},${user.id}`)) // not in the cache already, just to be sure
                    bans.set(`${message.guild.id},${user.id}`, { member: message.member, reason });
        }

        await button.editReply({
            embeds: [
                this.Embed.ok(
                    `${user} has been banned from the guild and ${Number.isNaN(clear) ? '7' : clear}` + 
                    ` days worth of messages have been removed.`
                )
            ],
            components: disableAll(msg)
        });
    }
}
import { Command, Arguments } from '../../Structures/Command.js';
import { Interaction, Message, MessageActionRow, MessageComponentInteraction, Permissions } from 'discord.js';
import { getMentions } from '../../lib/Utility/Mentions.js';
import ms from 'ms';
import { hasPerms, hierarchy } from '../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { Range } from '../../lib/Utility/Range.js';
import { validateNumber } from '../../lib/Utility/Valid/Number.js';
import { Components } from '../../lib/Utility/Constants/Components.js';
import { bans } from '../../lib/Cache/Bans.js';

const range = Range(0, 7, true);

@RegisterCommand
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
        const clear = typeof args[1] === 'string' ? Math.ceil(ms(args[1]) / 86400000) : 7;

        const member = message.guild.members.resolve(user);
        if (member && !hierarchy(message.member, member)) {
            return this.Embed.fail(`You do not have permission to ban ${member}!`);
        } else if (!user) {
            return this.Embed.fail(`No user id or user mentioned, no one was banned.`);
        }

        const row = new MessageActionRow()
			.addComponents(
                Components.approve('Yes'),
                Components.deny('No')
            );

        const msg = await message.reply({
            embeds: [this.Embed.success(`Are you sure you want to ban ${user}?`)],
            components: [row]
        });

        const filter = (interaction: Interaction) => 
            interaction.isMessageComponent() &&
            ['approve', 'deny'].includes(interaction.customID) && 
            interaction.user.id === message.author.id;

        let button: MessageComponentInteraction | null = null;
        try {
            button = await msg.awaitMessageComponentInteraction(filter, { time: 20_000 });
        } catch {
            return void msg.edit({
                embeds: [this.Embed.fail(`Didn't get confirmation to ban ${user}!`)],
                components: []
            });
        }

        if (button.customID === 'deny')
            return button.update({
                embeds: [this.Embed.fail(`${user} gets off lucky... this time (command was canceled)!`)],
                components: []
            }); 

        await button.deferUpdate();

        try {
            await message.guild.members.ban(user, {
                days: range.isInRange(clear) && validateNumber(clear) ? clear : 7,
                reason: args.slice(args[1] && ms(args[1]) ? 2 : 1).join(' ')
            });

            if (hasPerms(message.channel, message.guild.me, Permissions.FLAGS.VIEW_AUDIT_LOG))
                if (!bans.has(`${message.guild.id},${user.id}`)) // not in the cache already, just to be sure
                    bans.set(`${message.guild.id},${user.id}`, message.member);
        } catch {
            return button.editReply({
                embeds: [this.Embed.fail(`${user} isn't bannable!`)],
                components: []
            });
        }

        await button.editReply({
            embeds: [
                this.Embed.success(
                    `${user} has been banned from the guild and ${Number.isNaN(clear) ? '7' : clear}` + 
                    ` days worth of messages have been removed.`
                )
            ],
            components: []
        });
    }
}
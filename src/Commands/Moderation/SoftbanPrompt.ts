import { Command, Arguments } from '../../Structures/Command.js';
import { Interaction, MessageActionRow, Permissions } from 'discord.js';
import { parseStrToMs } from '../../lib/Utility/ms.js';
import { getMentions } from '../../lib/Utility/Mentions.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { plural } from '../../lib/Utility/String.js';
import { bans } from '../../lib/Cache/Bans.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { Range } from '../../lib/Utility/Range.js';
import { validateNumber } from '../../lib/Utility/Valid/Number.js';
import { Components, disableAll } from '../../lib/Utility/Constants/Components.js';
import { Message } from '../../lib/types/Discord.js.js';
import { bold } from '@discordjs/builders';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';

const range = Range(0, 7, true);

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Softban a member (bans and instantly unbans them; clearing recent messages).\n' +
                'Will prompt you to confirm before soft-banning them.',
                '@user for a good reason',
                '@user bye!',
                '239566240987742220'
            ],
			{
                name: 'softbanprompt', 
                folder: 'Moderation',
                aliases: [ 'softbnaprompt' ],
                args: [1],
                guildOnly: true,
                permissions: [ Permissions.FLAGS.BAN_MEMBERS ]
            }
        );
    }

    async init(message: Message, { args }: Arguments) {
        const user = await getMentions(message, 'users');
        if (!user) {
            return this.Embed.fail('No user mentioned and/or an invalid ❄️ was used!');
        }

        const clear = typeof args[1] === 'string'
            ? Math.ceil(parseStrToMs(args[1])! / 86400000)
            : 7;
        const reason = args.slice(args[1] && parseStrToMs(args[1]) ? 2 : 1).join(' ');

        const row = new MessageActionRow()
			.addComponents(
                Components.approve('Yes'),
                Components.deny('No')
            );

        const msg = await message.reply({
            embeds: [this.Embed.success(`
            Are you sure you want to soft-ban ${user}? 
    
            This will delete ${clear} day${plural(clear)} worth of messages from them, but they ${bold('will be')} allowed to rejoin the guild.
            `)],
            components: [row]
        });

        const filter = (interaction: Interaction) => 
            interaction.isMessageComponent() &&
            ['approve', 'deny'].includes(interaction.customId) && 
            interaction.user.id === message.author.id;

        const [buttonError, button] = await dontThrow(msg.awaitMessageComponent({ filter, time: 20_000 }));

        if (buttonError !== null) {
            return void msg.edit({
                embeds: [this.Embed.fail(`Didn't get confirmation to soft-ban ${user}!`)],
                components: []
            });
        }

        if (button.customId === 'deny')
            return void button.update({
                embeds: [this.Embed.fail(`${user} gets off lucky... this time (command was canceled)!`)],
                components: []
            }); 

        await button.deferUpdate();
        
        try {
            await message.guild.members.ban(user, {
                days: range.isInRange(clear) && validateNumber(clear) ? clear : 7,
                reason
            });
            await message.guild.members.unban(user, `Khafra-Bot: softban by ${message.author.tag} (${message.author.id})`);

            if (hasPerms(message.channel, message.guild.me, Permissions.FLAGS.VIEW_AUDIT_LOG))
                if (!bans.has(`${message.guild.id},${user.id}`)) // not in the cache already, just to be sure
                    bans.set(`${message.guild.id},${user.id}`, { member: message.member, reason });
        } catch {
            return void button.editReply({
                embeds: [this.Embed.fail(`${user} isn't bannable!`)],
                components: []
            });
        }

        return void button.editReply({
            embeds: [this.Embed.success(`${user} has been soft-banned from the guild!`)],
            components: disableAll(msg)
        });
    }
}
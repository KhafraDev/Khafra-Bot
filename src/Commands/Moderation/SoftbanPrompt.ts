import { Arguments, Command } from '#khaf/Command';
import { Components, disableAll } from '#khaf/utility/Constants/Components.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { getMentions } from '#khaf/utility/Mentions.js';
import { parseStrToMs } from '#khaf/utility/ms.js';
import { plural } from '#khaf/utility/String.js';
import { Range } from '#khaf/utility/Valid/Number.js';
import { ActionRow, bold } from '@khaf/builders';
import { Interaction, Message, Permissions } from 'discord.js';

const inRange = Range({ min: 0, max: 7, inclusive: true });

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

    async init(message: Message<true>, { args }: Arguments) {
        const user = await getMentions(message, 'users');
        if (!user) {
            return this.Embed.error('No user mentioned and/or an invalid ❄️ was used!');
        }

        const clear = typeof args[1] === 'string'
            ? Math.ceil(parseStrToMs(args[1])! / 86400000)
            : 7;
        const reason = args.slice(args[1] && parseStrToMs(args[1]) ? 2 : 1).join(' ');

        const row = new ActionRow().addComponents(
            Components.approve('Yes'),
            Components.deny('No')
        );

        const msg = await message.reply({
            embeds: [this.Embed.ok(`
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
                embeds: [this.Embed.error(`Didn't get confirmation to soft-ban ${user}!`)],
                components: []
            });
        }

        if (button.customId === 'deny')
            return void button.update({
                embeds: [this.Embed.error(`${user} gets off lucky... this time (command was canceled)!`)],
                components: []
            }); 

        await button.deferUpdate();
        
        try {
            await message.guild.members.ban(user, {
                days: inRange(clear) ? clear : 7,
                reason
            });
            await message.guild.members.unban(user, `Khafra-Bot: softban by ${message.author.tag} (${message.author.id})`);
        } catch {
            return void button.editReply({
                embeds: [this.Embed.error(`${user} isn't bannable!`)],
                components: []
            });
        }

        return void button.editReply({
            embeds: [this.Embed.ok(`${user} has been soft-banned from the guild!`)],
            components: disableAll(msg)
        });
    }
}
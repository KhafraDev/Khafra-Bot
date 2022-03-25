import { Arguments, Command } from '#khaf/Command';
import { Components, disableAll } from '#khaf/utility/Constants/Components.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { getMentions } from '#khaf/utility/Mentions.js';
import { parseStrToMs } from '#khaf/utility/ms.js';
import { hierarchy } from '#khaf/utility/Permissions.js';
import { Range } from '#khaf/utility/Valid/Number.js';
import { ActionRow, MessageActionRowComponent, type UnsafeEmbed } from '@discordjs/builders';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import { Message } from 'discord.js';

const inRange = Range({ min: 0, max: 7, inclusive: true });

export class kCommand extends Command {
    constructor () {
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
                aliases: ['bnaprompt'],
                args: [1],
                guildOnly: true,
                permissions: [PermissionFlagsBits.BanMembers]
            }
        );
    }

    async init (message: Message<true>, { args, content }: Arguments): Promise<UnsafeEmbed | undefined> {
        const user = await getMentions(message, 'users', content);
        const clear = typeof args[1] === 'string' ? Math.ceil(parseStrToMs(args[1])! / 86400000) : 7;
        const reason = args.slice(args[1] && parseStrToMs(args[1]) ? 2 : 1).join(' ');

        const member = user && message.guild.members.resolve(user);
        if (member && !hierarchy(message.member, member)) {
            return Embed.error(`You do not have permission to ban ${member}!`);
        } else if (!user) {
            return Embed.error('No user id or user mentioned, no one was banned.');
        }

        const row = new ActionRow<MessageActionRowComponent>().addComponents(
            Components.approve('Yes'),
            Components.deny('No')
        );

        const msg = await message.reply({
            embeds: [Embed.ok(`Are you sure you want to ban ${user}?`)],
            components: [row]
        });

        const [pressedError, button] = await dontThrow(msg.awaitMessageComponent({
            filter: (interaction) =>
                interaction.isMessageComponent() &&
                ['approve', 'deny'].includes(interaction.customId) &&
                interaction.user.id === message.author.id,
            time: 20_000
        }));

        if (pressedError !== null) {
            return void msg.edit({
                embeds: [Embed.error(`Didn't get confirmation to ban ${user}!`)],
                components: []
            });
        }

        if (button.customId === 'deny')
            return void button.update({
                embeds: [Embed.error(`${user} gets off lucky... this time (command was canceled)!`)],
                components: []
            });

        await button.deferUpdate();

        const [banError] = await dontThrow(message.guild.members.ban(user, {
            deleteMessageDays: inRange(clear) ? clear : 7,
            reason: reason.length > 0 ? reason : `Requested by ${message.author.id}`
        }));

        if (banError !== null) {
            return void button.editReply({
                embeds: [Embed.error(`${user} isn't bannable!`)],
                components: []
            });
        }

        await button.editReply({
            embeds: [
                Embed.ok(
                    `${user} has been banned from the guild and ${Number.isNaN(clear) ? '7' : clear}` +
                    ' days worth of messages have been removed.'
                )
            ],
            components: disableAll(msg)
        });
    }
}
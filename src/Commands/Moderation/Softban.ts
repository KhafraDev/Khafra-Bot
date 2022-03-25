import { Arguments, Command } from '#khaf/Command';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { getMentions } from '#khaf/utility/Mentions.js';
import { parseStrToMs } from '#khaf/utility/ms.js';
import { Range } from '#khaf/utility/Valid/Number.js';
import { type UnsafeEmbed } from '@discordjs/builders';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import { Message } from 'discord.js';

const inRange = Range({ min: 0, max: 7, inclusive: true });

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Softban a member (bans and instantly unbans them; clearing recent messages).',
                '@user for a good reason',
                '@user bye!',
                '239566240987742220'
            ],
            {
                name: 'softban',
                folder: 'Moderation',
                aliases: ['softbna'],
                args: [1],
                guildOnly: true,
                permissions: [PermissionFlagsBits.BanMembers]
            }
        );
    }

    async init (message: Message<true>, { args, content }: Arguments): Promise<UnsafeEmbed> {
        const member = await getMentions(message, 'users', content);
        if (!member) {
            return Embed.error('No user mentioned and/or an invalid ❄️ was used!');
        }

        const clear = typeof args[1] === 'string'
            ? Math.ceil(parseStrToMs(args[1])! / 86400000)
            : 7;
        const reason = args.slice(args[1] && parseStrToMs(args[1]) ? 2 : 1).join(' ');

        try {
            await message.guild.members.ban(member, {
                deleteMessageDays: inRange(clear) ? clear : 7,
                reason
            });
            await message.guild.members.unban(member, `Khafra-Bot: softban by ${message.author.tag} (${message.author.id})`);
        } catch {
            return Embed.error(`${member} isn't bannable!`);
        }

        return Embed.ok(`
        ${member} has been soft-banned from the guild!
        `);
    }
}
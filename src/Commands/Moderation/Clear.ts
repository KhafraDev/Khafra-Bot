import { Arguments, Command } from '#khaf/Command';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { isText } from '#khaf/utility/Discord.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { getMentions } from '#khaf/utility/Mentions.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { Range } from '#khaf/utility/Valid/Number.js';
import { inlineCode, type UnsafeEmbed } from '@discordjs/builders';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import { Message } from 'discord.js';

const inRange = Range({ min: 1, max: 100, inclusive: true });

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Clear messages from a given channel.',
                '100', '53'
            ],
            {
                name: 'clear',
                folder: 'Moderation',
                aliases: ['bulkdelete'],
                args: [1, 1],
                guildOnly: true,
                permissions: [PermissionFlagsBits.ManageMessages]
            }
        );
    }

    async init (message: Message<true>, { args }: Arguments): Promise<UnsafeEmbed | undefined> {
        const toDelete = Number(args[0]);

        if (!inRange(toDelete)) {
            return Embed.error(`${toDelete.toLocaleString()} is not within the range of 0-100 messages!`);
        }

        const channel = await getMentions(message, 'channels') ?? message.channel;

        if (!isText(channel) || !hasPerms(channel, message.guild.me, [PermissionFlagsBits.ManageMessages])) {
            return Embed.perms(
                channel,
                message.guild.me,
                PermissionFlagsBits.ManageMessages
            );
        } else if (message.deletable) {
            await dontThrow(message.delete());
        }

        const [err] = await dontThrow(channel.bulkDelete(toDelete, true));

        if (err !== null) {
            return Embed.error(`An unexpected error occurred: ${inlineCode(err.message)}.`);
        }
    }
}
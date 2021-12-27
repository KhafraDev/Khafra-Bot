import { Command, Arguments } from '#khaf/Command';
import { Message, Permissions, TextChannel } from 'discord.js';
import { isText } from '#khaf/utility/Discord.js';
import { Range } from '#khaf/utility/Valid/Number.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { getMentions } from '#khaf/utility/Mentions.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { inlineCode } from '@khaf/builders';

const inRange = Range({ min: 1, max: 100, inclusive: true });

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Clear messages from a given channel.',
                '100', '53'
            ], 
            {
                name: 'clear',
                folder: 'Moderation',
                aliases: [ 'bulkdelete' ],
                args: [1, 1],
                guildOnly: true,
                permissions: [ Permissions.FLAGS.MANAGE_MESSAGES ]
            }
        );
    }

    async init(message: Message<true>, { args }: Arguments) {
        const toDelete = Number(args[0]);

        if (!inRange(toDelete)) {
            return this.Embed.error(`${toDelete.toLocaleString()} is not within the range of 0-100 messages!`);
        }

        const channel = await getMentions(message, 'channels') ?? message.channel;
        
        if (!isText(channel) || !hasPerms(channel, message.guild?.me, [Permissions.FLAGS.MANAGE_MESSAGES])) {
            return this.Embed.perms(
                channel as TextChannel,
                message.guild.me,
                Permissions.FLAGS.MANAGE_MESSAGES
            );
        } else if (message.deletable) {
            await dontThrow(message.delete());
        }

        const [err] = await dontThrow(channel.bulkDelete(toDelete, true));

        if (err !== null) {
            return this.Embed.error(`An unexpected error occurred: ${inlineCode(err.message)}.`);
        }
    }
}
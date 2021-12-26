import { Command, Arguments } from '../../Structures/Command.js';
import { Message, Permissions, TextChannel } from 'discord.js';
import { isText } from '../../lib/types/Discord.js.js';
import { Range } from '../../lib/Utility/Valid/Number.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { getMentions } from '../../lib/Utility/Mentions.js';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';
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
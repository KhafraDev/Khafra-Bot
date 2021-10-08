import { Command, Arguments } from '../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { isText } from '../../lib/types/Discord.js.js';
import { Range } from '../../lib/Utility/Range.js';
import { validateNumber } from '../../lib/Utility/Valid/Number.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { getMentions } from '../../lib/Utility/Mentions.js';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';
import { inlineCode } from '@discordjs/builders';

const range = Range(1, 100, true);

@RegisterCommand
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

    async init(message: Message, { args }: Arguments) {
        const toDelete = Number(args[0]);

        if (!validateNumber(toDelete)) {
            return this.Embed.fail(`
            Received: ${toDelete}, this command requires a valid integer!

            Example: ${inlineCode(`${this.settings.name} 100`)}
            `);
        } else if (!range.isInRange(toDelete)) {
            return this.Embed.fail(`${toDelete.toLocaleString()} is not within the range of 0-100 messages!`);
        }

        const channel = await getMentions(message, 'channels', { idx: 1 }) ?? message.channel;
        
        if (!isText(channel) || !hasPerms(channel, message.guild!.me, [Permissions.FLAGS.MANAGE_MESSAGES])) {
            return this.Embed.fail('Can\'t delete messages from this type of channel, sorry!');
        } else if (message.deletable) {
            await dontThrow(message.delete());
        }

        const [err, deleted] = await dontThrow(channel.bulkDelete(toDelete, true));

        if (err !== null) {
            return this.Embed.fail(`An unexpected error occurred: ${inlineCode(err.message)}.`);
        }

        const embed = this.Embed.success()
            .setAuthor(message.client.user!.username, message.client.user!.displayAvatarURL())
            .setTimestamp()
            .setFooter(`Requested by ${message.author.tag}!`)
            .setDescription(`
            Successfully deleted ${deleted.size} messages!

            If this number isn't correct, it is because messages older than 2 weeks cannot be deleted!
            `);

        const [, m] = await dontThrow(message.reply({ embeds: [embed] }));
        setTimeout(() => {
            if (m?.deletable) void dontThrow(m.delete());
        }, 5000).unref();
    }
}
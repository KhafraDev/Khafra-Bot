import { Command, Arguments } from '../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { isText } from '../../lib/types/Discord.js.js';
import { Range } from '../../lib/Utility/Range.js';
import { validateNumber } from '../../lib/Utility/Valid/Number.js';

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
        const toDelete = Number(args.shift()) + 1;
        if (!range.isInRange(toDelete) || !validateNumber(toDelete)) {
            return this.Embed.fail(`
            Received: ${toDelete}, this command requires a valid integer!

            Example: \`\`${this.settings.name} 100\`\`
            `);
        }

        const channel = message.mentions.channels.size > 0 ? message.mentions.channels.first() : message.channel;
        if (!isText(channel))
            return this.Embed.fail('Can\'t delete messages from this type of channel, sorry!');

        const deleted = await channel.bulkDelete(toDelete > 100 ? 100 : toDelete, true);

        const embed = this.Embed.success()
            .setAuthor(message.client.user.username, message.client.user.displayAvatarURL())
            .setTimestamp()
            .setFooter(`Requested by ${message.author.tag}!`)
            .setDescription(`
            Successfully deleted ${deleted.size} messages!

            \`\`If this number isn't correct, it is because messages older than 2 weeks cannot be cleared and your input message has also been deleted.\`\`
            `);

        const m = await message.reply({ embeds: [embed] });
        setTimeout(() => {
            if (m.deletable) void m.delete();
        }, 5000).unref();
    }
}
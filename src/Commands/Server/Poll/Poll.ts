import { Command } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { parse } from 'twemoji-parser';
import { getMentions } from '../../../lib/Utility/Mentions.js';
import { isText } from '../../../lib/types/Discord.js.js';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

//const emojis = ['🟡', '⚪', '🔴', '🟣', '🟠', '🟢', '🟤', '🔵', '⚫'];
const basic = [ 
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.ADD_REACTIONS,
    Permissions.FLAGS.VIEW_CHANNEL,
    Permissions.FLAGS.EMBED_LINKS
];

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Create a poll in a channel.', 
                '705894525473784303'
            ],
			{
                name: 'poll',
                folder: 'Server',
                args: [1, 1],
                guildOnly: true,
                permissions: [ Permissions.FLAGS.ADD_REACTIONS ]
            }
        );
    }

    async init(message: Message) {
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR)) {
            return this.Embed.missing_perms(true);
        }

        const channel = await getMentions(message, 'channels') ?? message.channel;
        if (!isText(channel) || !message.guild.channels.resolve(channel)) {
            return this.Embed.fail(`Polls can only be sent to text or news channels.`);
        } else if (!hasPerms(channel, message.guild.me, basic)) {
            return this.Embed.missing_perms(false, basic);
        }

        await message.reply(this.Embed.success(`
        Setting up a poll now!

        Enter all of the options in separate messages in the form \`\`[emoji] [text]\`\` to get started.
        Once you're done, post \`\`stop\`\` (it will stop after 5 options automatically).
        You can also cancel the command using \`\`cancel\`\`.
        `));

        const filter = (m: Message) =>
            m.author.id === message.author.id &&
            parse(m.content).length > 0 ||
            ['stop', 'cancel'].includes(m.content.toLowerCase());

        const lines: { emoji: string, text: string }[] = []

        const collector = message.channel.createMessageCollector(filter, {
            max: 5,
            time: 60 * 1000 * 3
        });
        collector
            .on('collect', (m: Message) => {
                if (m.content.toLowerCase() === 'cancel')
                    return collector.stop('cancel');
                if (m.content.toLowerCase() === 'stop')
                    return collector.stop('stop');

                const parsed = parse(m.content);
                if (parsed.length === 0) return;
                const reg = new RegExp(`^${parsed[0].text} .*`);
                if (!reg.test(m.content)) return;

                const text = m.content.replace(new RegExp(`^${parsed[0].text}`), '');
                lines.push({ emoji: parsed[0].text, text });
            })
            .on('end', async (_c, r) => {
                if (r === 'cancel' || lines.length === 0)
                    return;

                try {
                    const m = await channel.send(this.Embed.success(
                        lines.map(l => `${l.emoji}: ${l.text}`).join('\n')
                    ));

                    await Promise.allSettled(lines.map(l => m.react(l.emoji)));
                } catch {}
            });
    }
}
import { Command } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import twemoji from 'twemoji-parser'; // cjs module
import { getMentions } from '../../../lib/Utility/Mentions.js';
import { isText } from '../../../lib/types/Discord.js.js';

const emojis = ['🟡', '⚪', '🔴', '🟣', '🟠', '🟢', '🟤', '🔵', '⚫'];
const basic = [ 
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.ADD_REACTIONS,
    Permissions.FLAGS.VIEW_CHANNEL,
    Permissions.FLAGS.EMBED_LINKS
];

export default class extends Command {
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
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ]) 
           && !this.isBotOwner(message.author.id)
        ) {
            return message.reply(this.Embed.missing_perms(true));
        }

        const channel = await getMentions(message, 'channels') ?? message.channel;
        if(!channel) {
            return message.reply(this.Embed.fail(`
            Channel isn't fetched or the ID is incorrect.
            `));
        } else if(!isText(channel)) {
            return message.reply(this.Embed.fail(`Polls can only be sent to text or news channels.`));
        } else if(!channel.permissionsFor(message.guild.me).has(basic)) {
            return message.reply(this.Embed.missing_perms(false, basic));
        }

        await message.reply(this.Embed.success(`
        Setting up a poll now!

        Enter all of the options in separate messages in the form \`\`[emoji] [text]\`\` to get started.
        Once you're done, post \`\`stop\`\` (it will stop after 5 options automatically).
        `));
        
        const lines: { emoji: string, text: string }[] = [];
        const filter = (m: Message) => twemoji.parse(m.content).length !== 0 
                                       || m.content.split(/\s+/).length <= 1;
        const collector = message.channel.createMessageCollector(filter, { max: 5, time: 60 * 1000 * 3 });
        collector.on('collect', (m: Message) => {
            if(m.content.toLowerCase() === 'stop') {
                return collector.stop('1');
            }

            const parsed = twemoji.parse(m.content);
            const text = m.content.replace(new RegExp(`^${parsed[0].text}`), '');
            
            lines.push({ 
                emoji: text === m.content ? emojis[Math.floor(Math.random() * emojis.length)] : parsed[0].text,
                text
            });
        })
        collector.on('end', async () => {
            if(lines.length === 0) return;

            const m = await channel.send(this.Embed.success(
                lines.map(l => `${l.emoji}: ${l.text}`).join('\n')
            ));

            for(const { emoji } of lines) {
                await m.react(emoji);
            }
        });
    }
}
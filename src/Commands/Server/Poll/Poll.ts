import { Command } from "../../../Structures/Command.js";
import { Message, Permissions } from "discord.js";
import twemoji from "twemoji-parser"; // cjs module
import { getMentions, validSnowflake } from "../../../lib/Utility/Mentions.js";
import { isText } from "../../../lib/types/Discord.js.js";

const emojis = ['🟡', '⚪', '🔴', '🟣', '🟠', '🟢', '🟤', '🔵', '⚫'];
const basic = new Permissions([ 
    'SEND_MESSAGES', 
    'ADD_REACTIONS', 
    'VIEW_CHANNEL', 
    'EMBED_LINKS' 
]);

export default class extends Command {
    constructor() {
        super(
            [
                'Create a poll in a channel.', 
                '705894525473784303'
            ],
            [ 'ADD_REACTIONS' ],
            {
                name: 'poll',
                folder: 'Server',
                args: [1, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ]) 
           && !this.isBotOwner(message.author.id)
        ) {
            return message.reply(this.Embed.missing_perms(true));
        }

        let idOrChannel = getMentions(message, args, { type: 'channels' });
        if(!idOrChannel || (typeof idOrChannel === 'string' && !validSnowflake(idOrChannel))) {
            idOrChannel = message.channel; 
        }

        const channel = message.guild.channels.resolve(idOrChannel);
        if(!channel) {
            this.logger.log(`Channel: ${channel}, ID: ${idOrChannel}`);
            return message.reply(this.Embed.fail(`
            Channel isn't fetched or the ID is incorrect.
            `));
        } else if(!isText(channel)) {
            return message.channel.send(this.Embed.fail(`Polls can only be sent to text or news channels.`));
        } else if(!channel.permissionsFor(message.guild.me).has(basic)) {
            return message.channel.send(this.Embed.missing_perms(false, basic.toArray()));
        }

        await message.channel.send(this.Embed.success(`
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
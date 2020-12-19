import { Message, MessageReaction, User } from 'discord.js';
import { Command } from '../../Structures/Command.js';
import { longestPoem } from '../../lib/Backend/LongestPoemInTheWorld.js';

export default class extends Command {
    constructor() {
        super(
            [ 
                '"A continuous stream of real-time tweets that rhyme."',
                ''
            ],
			{
                name: 'longestpoem',
                folder: 'Fun',
                aliases: [ 'poem', 'longestpoemintheworld', 'lpitm' ],
                args: [0, 0]
            }
        );
    }

    async init(message: Message) {
        let poem: string | null = null;
        try {
            poem = await longestPoem();
        } catch(e) {
            if(e.name === 'FetchError') {
                return message.reply(this.Embed.fail('Server failed to process the request!'));
            }

            return message.reply(this.Embed.fail(`An unexpected ${e.name} occurred!`));
        }

        const m = await message.reply(this.Embed.success(poem.slice(0, 2048)));
        if(!m) return;
        // allSettled won't throw if there's an error
        await Promise.allSettled(['➡️', '🗑️'].map(e => m.react(e)));

        const collector = m.createReactionCollector(
            (r: MessageReaction, u: User) => u.id === message.author.id && ['➡️', '🗑️'].includes(r.emoji.name),
            { time: 120000, max: 10 }
        );
        collector.on('collect', async r => {
            if(r.emoji.name === '➡️') {
                try {
                    const poem = await longestPoem();
                    return m.edit(this.Embed.success(poem.slice(0, 2048)));
                } catch {
                    return collector.stop();
                }
            }

            return collector.stop();
        });
        collector.on('end', () => {
            try {
                return m.reactions.removeAll();
            } catch {}
        });
    }
}
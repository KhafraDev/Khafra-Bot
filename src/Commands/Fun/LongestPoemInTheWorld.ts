import { Message, MessageReaction, User } from 'discord.js';
import { Command } from '../../Structures/Command.js';
import { longestPoem } from '../../lib/Packages/LongestPoemInTheWorld.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [ 
                '"A continuous stream of real-time tweets that rhyme."'
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
        const poem = await longestPoem();

        const m = await message.reply({ embed: this.Embed.success(poem.slice(0, 2048)) });
        // allSettled won't throw if there's an error
        await Promise.allSettled(['➡️', '🗑️'].map(e => m.react(e)));

        const collector = m.createReactionCollector(
            (r: MessageReaction, u: User) => u.id === message.author.id && ['➡️', '🗑️'].includes(r.emoji.name),
            { time: 120000, max: 10 }
        );
        collector.on('collect', async r => {
            if (r.emoji.name === '➡️') {
                const poem = await longestPoem();
                return m.edit({ embed: this.Embed.success(poem.slice(0, 2048)) });
            }

            return collector.stop();
        });
        collector.on('end', () => {
            return m.reactions.removeAll();
        });
    }
}
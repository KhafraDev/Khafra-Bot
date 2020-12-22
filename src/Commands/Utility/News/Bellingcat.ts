import { Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { bellingcatInterval, cache } from '../../../lib/Backend/BellingCat.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Get the latest articles from Bellingcat!',
                ''
            ],
			{
                name: 'bellingcat',
                folder: 'News',
                args: [0, 0],
                aliases: ['belling']
            }
        );
    }

    async init(message: Message) {
        if(cache.size === 0) {
            await bellingcatInterval();
        }

        const articles = [...cache.values()];
        if(articles.length === 0) {
            return message.reply(this.Embed.fail(`
            An error occurred fetching the articles.
            `));
        }

        return message.reply(this.Embed.success(`
        ${articles.map((a,i) => `[${i+1}] [${a.title}](${a.href})`).join('\n')}
        `));
    }
}
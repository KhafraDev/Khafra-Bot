import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { cache, fetchHN } from '../../../lib/Backend/HackerNews.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch top articles from https://news.ycombinator.com/',
                ''
            ],
            {
                name: 'hackernews',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'hn' ]
            }
        );
    }

    async init(message: Message) {
        if(cache.size === 0) {
            await fetchHN();
            if(cache.size === 0) {
                return message.reply(this.Embed.fail('Failed to fetch the articles!'));
            }
        }

        const stories = [...cache.values()];
        return message.reply(this.Embed.success(`
        ${stories
            .map((s,i) => `[${i+1}]: [${s.title}](${s.url})`)
            .join('\n')
        }
        `));
    }
}
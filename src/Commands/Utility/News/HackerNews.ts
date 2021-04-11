import { Command } from '../../../Structures/Command.js';
import { cache, fetchHN } from '../../../lib/Backend/HackerNews.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { once } from '../../../lib/Utility/Memoize.js';

const mw = once(fetchHN);

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Fetch top articles from https://news.ycombinator.com/',
            ],
            {
                name: 'hackernews',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'hn' ]
            }
        );
    }

    async init() {
        await mw();
        
        if (cache.size === 0) {
            return this.Embed.fail('Failed to fetch the articles!');
        }

        const stories = [...cache.values()];
        return this.Embed.success(`
        ${stories
            .map((s,i) => `[${i+1}]: [${s.title}](${s.url})`)
            .join('\n')
        }
        `);
    }
}
import { Command } from '#khaf/Command';
import { cache, fetchHN } from '#khaf/utility/commands/HackerNews';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { type UnsafeEmbedBuilder } from '@discordjs/builders';

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Fetch top articles from https://news.ycombinator.com/'
            ],
            {
                name: 'hackernews',
                folder: 'News',
                args: [0, 0],
                aliases: ['hn']
            }
        );
    }

    async init (): Promise<UnsafeEmbedBuilder> {
        await fetchHN();

        if (cache.size === 0) {
            return Embed.error('Failed to fetch the articles!');
        }

        const stories = [...cache.values()];
        return Embed.ok(`
        ${stories
        .map((s,i) => `[${i+1}]: [${s.title}](${s.url})`)
        .join('\n')
}
        `);
    }
}
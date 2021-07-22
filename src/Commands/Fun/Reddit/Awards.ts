import { Command, Arguments } from '../../../Structures/Command.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { URLFactory } from '../../../lib/Utility/Valid/URL.js';
import { Message } from 'discord.js';
import { RedditData } from '@khaf/badmeme';
import fetch from 'undici-fetch';

const PER_COIN = 1.99 / 500;

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Calculate how much people have spent on Reddit awards for a post.',
                'https://www.reddit.com/r/pics/comments/jcjf3d/wouldbe_president_joe_biden_wrote_this_letter_to/'
            ], 
            {
                name: 'award',
                folder: 'Fun',
                aliases: [ 'awards', 'awardprice' ],
                args: [1, 1],
                ratelimit: 7
            }
        );
    }

    async init(_message: Message, { args }: Arguments) {
        const url = URLFactory(args[0]);
        if (url === null)
            return this.Embed.fail('Invalid Reddit post!');

        if (
            url.origin !== 'https://www.reddit.com' ||
            // "Names cannot have spaces, must be between 3-21 characters, and underscores are allowed."
            !/^\/r\/[A-z0-9_]{3,21}/.test(url.pathname)
        ) {
            return this.Embed.fail(`
            Not a valid reddit URL!
            Make sure it's from \`\`https://www.reddit.com\`\` and it's a post!
            `);
        }
        
        const res = await fetch(`${url.href.replace(/.json$/, '')}.json`);
        const json = await res.json() as [RedditData, RedditData];

        const post = json[0]?.data?.children?.[0]?.data;
        if (!post) {
            return this.Embed.fail(this.errors.FetchError);
        }

        const coins = post.all_awardings.reduce((p, c) => p + (c.coin_price * c.count), 0);
        const price = (coins * PER_COIN).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        const number = post.all_awardings.reduce((p, c) => p + c.count, 0);

        return this.Embed.success(`
        Post has been awarded \`\`${number}\`\` times, estimating around \`\`${price}\`\` USD (at a rate of $1.99 per 500 coins).
        `);
    }
}
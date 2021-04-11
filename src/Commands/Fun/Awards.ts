import { Command, Arguments } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { URL } from 'node:url';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { fetch } from '../../Structures/Fetcher.js';

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
        const url = new URL(args[0]);
        [...url.searchParams.keys()].forEach(k => url.searchParams.delete(k));

        if (
            url.origin !== 'https://www.reddit.com' ||
            !/^\/r\/(.*)\//.test(url.pathname)
        ) {
            return this.Embed.fail(`
            Not a valid reddit URL!
            Make sure it's from \`\`https://www.reddit.com\`\` and it's a post!
            `);
        }
        
        const json = await fetch()
            .get(`${url.href.replace(/.json$/, '')}.json`)
            .json();

        const post = json[0]?.data?.children?.[0]?.data;
        if (!post) {
            return this.Embed.fail(this.errors.FetchError);
        }

        const coins = post.all_awardings.reduce(
            (p: number, c: Record<string, number>) => p + (c.coin_price * c.count), 0
        );
        const price = (coins * (1.99 / 500)).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        const number = post.all_awardings.reduce((p: number, c: { count: number; }) => p + c.count, 0);

        return this.Embed.success(`
        Post has been awarded \`\`${number}\`\` times, totaling around \`\`${price}\`\` USD.
        `);
    }
}
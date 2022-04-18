import type { Arguments} from '#khaf/Command';
import { Command } from '#khaf/Command';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { URLFactory } from '#khaf/utility/Valid/URL.js';
import { inlineCode, type UnsafeEmbedBuilder } from '@discordjs/builders';
import type { Reddit } from '@khaf/badmeme';
import type { Message } from 'discord.js';
import { request } from 'undici';

const PER_COIN = 1.99 / 500;

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Calculate how much people have spent on Reddit awards for a post.',
                'https://www.reddit.com/r/pics/comments/jcjf3d/wouldbe_president_joe_biden_wrote_this_letter_to/'
            ],
            {
                name: 'award',
                folder: 'Fun',
                aliases: ['awards', 'awardprice'],
                args: [1, 1],
                ratelimit: 7
            }
        );
    }

    async init (_message: Message, { args }: Arguments): Promise<UnsafeEmbedBuilder> {
        const url = URLFactory(args[0]);
        if (url === null)
            return Embed.error('Invalid Reddit post!');

        if (
            url.origin !== 'https://www.reddit.com' ||
            // "Names cannot have spaces, must be between 3-21 characters, and underscores are allowed."
            !/^\/r\/[A-z0-9_]{3,21}/.test(url.pathname)
        ) {
            return Embed.error(`
            Not a valid reddit URL!
            Make sure it's from ${inlineCode('https://www.reddit.com')} and it's a post!
            `);
        }

        const { body } = await request(`${url.href.replace(/.json$/, '')}.json`);
        const json = await body.json() as [Reddit, Reddit];

        const post = json[0].data!.children[0].data;
        const coins = post.all_awardings.reduce(
            (p, c) => p + c.coin_price * c.count, 0
        );
        const price = (coins * PER_COIN).toLocaleString('en-US',
            { style: 'currency', currency: 'USD' }
        );
        const count = post.all_awardings.reduce((p, c) => p + c.count, 0);

        return Embed.ok()
            .setDescription(
                `Post has been awarded ${inlineCode(count.toLocaleString())} times, ` +
                `estimating around ${inlineCode(price)} USD (at a rate of $1.99 per 500 coins).`
            )
            .setFooter({ text: 'Free awards are counted in the cost!' });
    }
}
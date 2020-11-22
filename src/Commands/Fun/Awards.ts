import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { URL } from 'url';
import fetch from 'node-fetch';

export default class extends Command {
    constructor() {
        super(
            [
                'Calculate how much people have spent on Reddit awards for a post.',
                'https://www.reddit.com/r/pics/comments/jcjf3d/wouldbe_president_joe_biden_wrote_this_letter_to/'
            ], 
            [ /* No extra perms needed */ ],
            {
                name: 'award',
                folder: 'Fun',
                aliases: [ 'awards', 'awardprice' ],
                args: [1, 1]
            }
        );
    }

    async init(message: Message, args: string[]) {
        let url;
        try {
            url = new URL(args[0]);
        } catch {
            return message.reply(this.Embed.fail('Invalid URL!'));
        }

        if(
            url.origin !== 'https://www.reddit.com' ||
            !/^\/r\/(.*)\//.test(url.pathname) ||
            [...url.searchParams.keys()].length !== 0
        ) {
            return message.reply(this.Embed.fail(`
            Not a valid reddit URL!
            Make sure it's from \`\`https://www.reddit.com\`\` and has no search params (everything after a "?").
            `));
        }
        
        let json;
        try {
            const res = await fetch(url.href.replace(/.json$/, '') + '.json');
            const j = await res.json();
            json = j;
        } catch {
            return message.reply(this.Embed.fail('Bad URL, try another one.'));
        }

        const post = json[0]?.data?.children?.[0]?.data;
        if(!post) {
            return message.reply(this.Embed.fail('Bad URL, try another one.'));
        }
        const coins = post.all_awardings.reduce(
            (p: number, c: Record<string, number>) => p + (c.coin_price * c.count), 0
        );
        const price = (coins * (1.99 / 500)).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        const number = post.all_awardings.reduce((p: number, c: { count: number; }) => p + c.count, 0);

        return message.reply(this.Embed.success(`
        Post has been awarded \`\`${number}\`\` times, totaling around \`\`${price}\`\` USD.
        `));
    }
}
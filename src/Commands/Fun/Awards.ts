import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { parse } from 'url';
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
        const URL = parse(args[0]);
        if(!URL.hostname?.endsWith('reddit.com')) {
            return message.channel.send(this.Embed.fail(`Not a reddit post. Nice try.`));
        }
        
        let json;
        try {
            const res = await fetch(URL.href.replace('.json', '') + '.json');
            const j = await res.json();
            json = j;
        } catch {
            return message.channel.send(this.Embed.fail('Bad URL, try another one.'));
        }

        const post = json[0]?.data?.children?.[0]?.data;
        if(!post) {
            return message.channel.send(this.Embed.fail('Bad URL, try another one.'));
        }
        const coins = post.all_awardings.reduce(
            (p: number, c: Record<string, number>) => p + (c.coin_price * c.count), 0
        );
        const price = (coins * (1.99 / 500)).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

        return message.channel.send(this.Embed.success(`
        Post has been awarded \`\`${post.all_awardings.length}\`\` times, totaling around \`\`${price}\`\` USD.
        `));
    }
}
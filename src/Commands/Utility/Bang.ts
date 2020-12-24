import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import fetch from 'node-fetch';
import { URL } from 'url';

type Bang = {
    sc: string,
    c: string,
    u: string,
    d: string,
    r: number,
    // important ones
    t: string,
    s: string
}

let json: Bang[] | null;
try {
    const res = await fetch('https://duckduckgo.com/bang.v260.js');
    json = await res.json();
} catch {}

export default class extends Command {
    constructor() {
        super(
            [
                'Use a shortcut (or as DuckDuckGo refers to them as, "bangs") to quickly search sites.\n'
                + 'There are ' + (Array.isArray(json) ? json.length.toLocaleString() : '0') + ' bangs!\n'
                + 'https://duckduckgo.com/bangs',
                'wiki Khafra', 'g This is a Google search'
            ],
			{
                name: 'bang',
                folder: 'Utility',
                args: [1],
                aliases: [ 'bangs' ]
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(!Array.isArray(json)) {
            return message.reply(this.Embed.fail('Bangs failed to load.'));
        }

        const search = args[0].toLowerCase();
        const item = json.filter(b => b.t === search || b.s.toLowerCase() === search);
        if(item.length === 0) {
            return message.reply(this.Embed.fail('No bang found!'));
        }

        const first = item.shift();
        const u = new URL(first.u);
        const formatted = args.length === 1
            ? u.origin
            : first.u.replace('{{{s}}}', encodeURIComponent(args.slice(1).join(' ')));

        return message.reply(this.Embed.success(`
        ${first.sc} - ${first.s}
        [Click Here](https://duckduckgo.com/l/?uddg=${encodeURIComponent(formatted)})
        `));
    }
}

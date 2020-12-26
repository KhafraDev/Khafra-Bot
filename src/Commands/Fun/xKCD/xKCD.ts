import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { xKCDFormatted } from '../../../lib/Backend/xKCD.js';
import { isValidNumber } from '../../../lib/Utility/Valid/Number.js';
import { promisify } from 'util';
import { randomInt } from 'crypto';
import xkcd from '../../../../assets/xkcd.json';

const rand: (a: number, b?: number) => Promise<number> = promisify(randomInt);

export const cache = { xkcd }

export default class extends Command {
    constructor() {
        super(
            [
                'Get an xKCD article by title or a random one!',
                ''
            ],
			{
                name: 'xkcd',
                folder: 'Fun',
                args: [0]
            }
        );
    }

    async init(message: Message, args: string[]) {
        const s = args.join(' ').toLowerCase();
        let comic: xKCDFormatted | null = null;

        if(args.length > 0) {
            if(isValidNumber(+s)) {
                comic = cache.xkcd.find(c => c.num === +s) ?? 
                        cache.xkcd.find(c => c.safe_title.toLowerCase() === s); 
            } else {
                comic = cache.xkcd.find(c => c.safe_title.toLowerCase() === s);
            }
        }

        if(!comic) {
            comic = cache.xkcd[await rand(cache.xkcd.length)];
        }

        return message.reply(this.Embed.success()
            .setTitle(`${comic.safe_title} - #${comic.num}`)
            .setImage(comic.img)
            .setTimestamp(new Date(comic.date))
        );
    }
}
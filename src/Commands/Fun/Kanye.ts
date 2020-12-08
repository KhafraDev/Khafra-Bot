import { Message } from 'discord.js';
import { join } from 'path';
import { readFileSync } from 'fs';
import { promisify } from 'util';
import { randomInt } from 'crypto';
import { Command } from '../../Structures/Command.js';

const rand: (a: number, b?:number) => Promise<number> = promisify(randomInt);

const base = join(process.cwd(), 'assets/kanye.txt');
const quotes = readFileSync(base, 'utf-8')
    .split(/\r\n|\n/g)
    .filter(l => !l.startsWith('#'));

export default class extends Command {
    constructor() {
        super(
            [
                'Get a quote from Kanye.',
                ''
            ],
			{
                name: 'kanye',
                folder: 'Fun',
                args: [0, 0]
            }
        );
    }

    async init(message: Message) {
        const q = quotes[await rand(quotes.length)];
        return message.reply(this.Embed.success(q));
    }
}
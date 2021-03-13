import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { rand } from '../../lib/Utility/Constants/OneLiners.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

// "jokes"
const file = await readFile(join(process.cwd(), 'assets/yomama.txt'), 'utf-8');
const jokes = file.split(/\r\n|\n/g).reduce((p, c) => {
    c.startsWith('NSFW:') ? p.nsfw.push(c.slice(5)) : p.sfw.push(c);
    return p;
}, { nsfw: [], sfw: [] });

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'The most funny and epic jokes on the planet: Yo Mama jokes!'
            ],
			{
                name: 'yomama',
                folder: 'Fun',
                args: [0, 0]
            }
        );
    }

    async init(message: Message) {
        const nsfw = 'nsfw' in message.channel ? message.channel.nsfw : true;
        const all = nsfw ? [...jokes.nsfw, ...jokes.sfw] : [...jokes.sfw];
        const epicfunnyjoke = all[await rand(all.length)];
        return this.Embed.success(epicfunnyjoke);
    }
}
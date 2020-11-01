import { Command } from "../../Structures/Command.js";
import { Message, TextChannel } from "discord.js";
import { readFile } from 'fs/promises';
import { join } from "path";

// "jokes"
const file = await readFile(join(process.cwd(), 'assets/yomama.txt'), 'utf-8');
const jokes = file.split(/\r\n|\n/g).reduce((p, c) => {
    c.startsWith('NSFW:') ? p.nsfw.push(c.slice(5)) : p.sfw.push(c);
    return p;
}, { nsfw: [], sfw: [] });

export default class extends Command {
    constructor() {
        super(
            [
                'The most funny and epic jokes on the planet: Yo Mama jokes!',
                ''
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'yomama',
                folder: 'Fun',
                args: [0, 0]
            }
        );
    }

    async init(message: Message) {
        const all = (message.channel as TextChannel).nsfw ? [...jokes.nsfw, ...jokes.sfw] : [...jokes.sfw];
        const epicfunnyjoke = all[Math.floor(Math.random() * all.length)];
        return message.channel.send(this.Embed.success(epicfunnyjoke));
    }
}
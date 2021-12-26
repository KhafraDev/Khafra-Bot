import { Command } from '#khaf/Command';
import { Message } from 'discord.js';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { rand } from '#khaf/utility/Constants/OneLiners.js';
import { isText } from '../../lib/types/Discord.js.js';
import { upperCase } from '#khaf/utility/String.js';
import { assets } from '#khaf/utility/Constants/Path.js';

// "jokes"
const file = await readFile(join(assets, 'yomama.txt'), 'utf-8');
const jokes = file.split(/\r?\n/g).slice(0, -1); // last line will be empty

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
        if (isText(message.channel) && !message.channel.nsfw)
            return this.Embed.error('🔞 This command only works in NSFW channels.');

        return this.Embed.ok(upperCase(jokes[await rand(jokes.length)]));
    }
}
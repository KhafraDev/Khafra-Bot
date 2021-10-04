import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { rand } from '../../lib/Utility/Constants/OneLiners.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { isText } from '../../lib/types/Discord.js.js';
import { upperCase } from '../../lib/Utility/String.js';
import { assets } from '../../lib/Utility/Constants/Path.js';

// "jokes"
const file = await readFile(join(assets, 'yomama.txt'), 'utf-8');
const jokes = file.split(/\r\n|\n/g).slice(0, -1); // last line will be empty

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
        if (isText(message.channel) && !message.channel.nsfw)
            return this.Embed.fail('🔞 This command only works in NSFW channels.');

        return this.Embed.success(upperCase(jokes[await rand(jokes.length)]));
    }
}
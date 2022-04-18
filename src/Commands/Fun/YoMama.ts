import { Command } from '#khaf/Command';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { assets } from '#khaf/utility/Constants/Path.js';
import { isText } from '#khaf/utility/Discord.js';
import { upperCase } from '#khaf/utility/String.js';
import { type UnsafeEmbedBuilder } from '@discordjs/builders';
import type { Message } from 'discord.js';
import { readFileSync } from 'node:fs';

// "jokes"
const file = readFileSync(assets('yomama.txt'), 'utf-8');
const jokes = file.split(/\r?\n/g).slice(0, -1); // last line will be empty

export class kCommand extends Command {
    constructor () {
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

    async init (message: Message): Promise<UnsafeEmbedBuilder> {
        if (isText(message.channel) && !message.channel.nsfw)
            return Embed.error('🔞 This command only works in NSFW channels.');

        const joke = jokes[Math.floor(Math.random() * jokes.length)];
        return Embed.ok(upperCase(joke));
    }
}
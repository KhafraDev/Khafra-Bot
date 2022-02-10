import { Command } from '#khaf/Command';
import { Message } from 'discord.js';

const base = `Ghost Pinged! ||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||||**⃣**||`;

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Ghost ping yourself! Bug [here](https://bugs.discord.com/T812#28651); message [here](https://paste.ee/p/4IcZq).'
            ],
            {
                name: 'hacks:ghostping',
                folder: 'Debug',
                args: [0, 0],
                ratelimit: 3,
                aliases: ['hacks:ghost']
            }
        );
    }

    async init (message: Message): Promise<void> {
        return void message.channel.send({ content: `${base} ${message.member}` });
    }
}

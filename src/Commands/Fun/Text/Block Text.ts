import { Arguments, Command } from '#khaf/Command';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { type UnsafeEmbed } from '@discordjs/builders';
import { Message } from 'discord.js';

const letters: Record<string, string> = {
    a: '🇦', b: '🇧', c: '🇨', d: '🇩',
    e: '🇪', f: '🇫', g: '🇬', h: '🇭',
    i: '🇮', j: '🇯', k: '🇰', l: '🇱',
    m: '🇲', n: '🇳', o: '🇴', p: '🇵',
    q: '🇶', r: '🇷', s: '🇸', t: '🇹',
    u: '🇺', v: '🇻', w: '🇼', x: '🇽',
    y: '🇾', z: '🇿'
}

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Emojify some text.',
                'Have a great day!', 'You suck.'
            ],
            {
                name: 'blocksay',
                folder: 'Fun',
                args: [1],
                ratelimit: 3,
                aliases: ['block', 'blocktext']
            }
        );
    }

    async init (_message: Message, { content }: Arguments): Promise<UnsafeEmbed> {
        const blocks = [...content]
            .map(l => l.toLowerCase() in letters ? letters[l.toLowerCase()] : l)
            .join(' ');

        return Embed.ok(blocks);
    }
}
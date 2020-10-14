import { Command } from '../../../Structures/Command';
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

export default class extends Command {
    constructor() {
        super(
            [
                'Emojify some text.',
                'Have a great day!', 'You suck.'
            ], 
            [ /* No extra perms needed */ ],
            {
                name: 'blocksay',
                folder: 'Fun',
                aliases: [ 'block', 'blocktext' ],
                args: [1]
            }
        );
    }

    init(message: Message, args: string[]) {        
        const blocks = args
            .join(' ')
            .replace(/[A-z\s+]/g, e => e in letters ? letters[e] + ' ' : '')
            .slice(0, 2048);

        return message.channel.send(this.Embed.success(blocks));
    }
}
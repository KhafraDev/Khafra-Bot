import { Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

const letters: Record<string, string> = {
    a: '🇦', b: '🇧', c: '🇨', d: '🇩',
    e: '🇪', f: '🇫', g: '🇬', h: '🇭',
    i: '🇮', j: '🇯', k: '🇰', l: '🇱',
    m: '🇲', n: '🇳', o: '🇴', p: '🇵',
    q: '🇶', r: '🇷', s: '🇸', t: '🇹',
    u: '🇺', v: '🇻', w: '🇼', x: '🇽',
    y: '🇾', z: '🇿'
}

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Emojify some text.',
                'Have a great day!', 'You suck.'
            ], 
            {
                name: 'blocksay',
                folder: 'Fun',
                aliases: [ 'block', 'blocktext' ],
                args: [1]
            }
        );
    }

    init(_message: Message, args: string[]) {        
        const blocks = args
            .join(' ')
            .replace(/[A-z\s+]/g, e => e in letters ? letters[e] + ' ' : '')
            .slice(0, 2048);

        return this.Embed.success(blocks);
    }
}
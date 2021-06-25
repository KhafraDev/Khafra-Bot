import { Command, Arguments } from '../../../Structures/Command.js';
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
                args: [1],
                ratelimit: 3,
                aliases: [ 'block', 'blocktext' ]
            }
        );
    }

    init(_message: Message, { content }: Arguments) {     
        const blocks = [...content]
            .map(l => letters[l.toLowerCase()] ?? l)
            .join(' ');

        return this.Embed.success(blocks);
    }
}
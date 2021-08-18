import { Command, Arguments } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

const superscript: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²',
    '3': '³', '4': '⁴', '5': '⁵', 
    '6': '⁶', '7': '⁷', '8': '⁸',
    '9': '⁹', '+': '⁺', '-': '⁻',
    'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ',
    'd': 'ᵈ', 'e': 'ᵉ', 'f': 'ᶠ',
    'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ',
    'j': 'ʲ', 'k': 'ᵏ', 'l': 'ˡ',
    'm': 'ᵐ', 'n': 'ⁿ', 'o': 'ᵒ',
    'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ',
    't': 'ᵗ', 'u': 'ᵘ', 'v': 'ᵛ',
    'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ',
    'z': 'ᶻ'
};

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Have KhafraBot superscript some text!',
                'Have a great day!', 'You suck.'
            ], 
            {
                name: 'superscript',
                folder: 'Fun',
                args: [1],
                ratelimit: 3
            }
        );
    }

    init(_message: Message, { content }: Arguments) {
        const split = [...content]
            .map(c => superscript[c.toLowerCase()] ?? c)
            .join('');

        return this.Embed.success(split);
    }
}
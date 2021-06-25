import { Command, Arguments } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

const consonants = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'];
const vowels = ['A', 'E', 'I', 'O', 'U'];

const toPigLatin = (sentence: string) => {
    const words = sentence.split(/\s+/g);
    const pigLatin: string[] = [];

    for (const word of words) {
        const start = word.charAt(0).toUpperCase();
        if (consonants.includes(start)) {
            if (word.length > 1 && consonants.includes(word.charAt(1).toUpperCase())) {
                // When words begin with consonant clusters (multiple consonants that form one sound), 
                // the whole sound is added to the end when speaking or writing
                let consonantsStart = 0;
                for (let i = 0; i < word.length; i++) {
                    if (consonants.includes(word[i].toUpperCase())) {
                        consonantsStart++;
                    } else {
                        break;
                    }
                }

                pigLatin.push(`${word.slice(consonantsStart)}${word.slice(0, consonantsStart)}ay`);
            } else {
                // For words that begin with consonant sounds, all letters before the initial 
                // vowel are placed at the end of the word sequence. Then, "ay" is added
                pigLatin.push(`${word.slice(1)}${word[0]}ay`)
            }
        } else if (vowels.includes(start)) {
            // For words that begin with vowel sounds, the vowel is left alone, and most commonly 'yay' is added to the end.
            pigLatin.push(`${word}yay`);
        } else {
            // symbols, etc.
            pigLatin.push(word);
        }
    }

    return pigLatin.join(' ');
}

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Convert English to Pig Latin!',
                'To make pure ice, you freeze water. Oak is strong and also gives shade.'
            ],
			{
                name: 'piglatin',
                folder: 'Fun',
                args: [1],
                ratelimit: 3
            }
        );
    }

    async init(_message: Message, { content }: Arguments) {
        const pig = toPigLatin(content);
        return this.Embed.success(pig.slice(0, 2048))
    }
}
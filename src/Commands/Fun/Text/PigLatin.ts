import { Arguments, Command } from '#khaf/Command';
import { type UnsafeEmbed } from '@discordjs/builders';
import { Message } from 'discord.js';

const consonants = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'];
const vowels = ['A', 'E', 'I', 'O', 'U'];

const splitWord = (word: string): { an: string[], p: string[] } => {
    const punc = {
        // alphanumeric
        an: [] as string[],
        // punctuation
        p: [] as string[]
    };

    for (let i = 0; i < word.length; i++) {
        const letter = word[i].toUpperCase();
        if (consonants.includes(letter) || vowels.includes(letter) || !Number.isNaN(Number(letter))) {
            punc.an.push(word[i]);
        } else {
            punc.p.push(word[i]);
        }
    }

    return punc;
}

const toPigLatin = (sentence: string): string => {
    const words = sentence.split(/\s+/g);
    const pigLatin = [];

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

                const front = splitWord(word.slice(consonantsStart));
                const back = splitWord(word.slice(0, consonantsStart));
                pigLatin.push(`${front.an.join('')}${back.an.join('')}ay${front.p.join('')}${back.p.join('')}`)
                // pigLatin.push(`${word.slice(consonantsStart)}${word.slice(0, consonantsStart)}ay`);
            } else {
                // For words that begin with consonant sounds, all letters before the initial
                // vowel are placed at the end of the word sequence. Then, "ay" is added
                const { an, p } = splitWord(word);
                pigLatin.push(`${an.slice(1).join('')}${an[0]}ay${p.join('')}`)
            }
        } else if (vowels.includes(start)) {
            // For words that begin with vowel sounds, the vowel is left alone, and most commonly 'yay' is added to the end.
            const { an, p } = splitWord(word);
            pigLatin.push(`${an.join('')}yay${p.join('')}`);
        } else {
            // symbols, etc.
            pigLatin.push(word);
        }
    }

    return pigLatin.join(' ');
}

export class kCommand extends Command {
    constructor () {
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

    async init (_message: Message, { content }: Arguments): Promise<UnsafeEmbed> {
        const pig = toPigLatin(content);
        return this.Embed.ok(pig.slice(0, 2048))
    }
}
import { Command, Arguments } from '../../../Structures/Command.js';
import { Message, MessageAttachment } from 'discord.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { once } from '../../../lib/Utility/Memoize.js';
import { dontThrow } from '../../../lib/Utility/Don\'tThrow.js';
import { fetch } from 'undici';

const fetchWords = once(async () => {
    const [e, r] = await dontThrow(fetch('https://raw.githubusercontent.com/dwyl/english-words/master/words.txt'));

    if (e !== null) return [];

    const all = await r.text();
    const words = all.split(/\n\r|\r\n|\n|\r/g);

    const filtered = words
        .filter(w => 
            w.length > 2 && // a, a-, etc.
            /^[A-z]+$/.test(w) && // only A-z
            new Set([...w]).size > 1 // ZZZ, etc
        )
        .map(w => w.toLowerCase());

    return [...new Set(filtered)];
});

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get a list of words that can be spelled given an assortment of letters.',
                'd???t? eltidu -> ? are placeholders or unknown characters'
            ], 
            {
                name: 'bb',
                folder: 'Fun',
                args: [2, 2],
                ratelimit: 3,
            }
        );
    }

    async init(_message: Message, { args }: Arguments) {     
        const words = await fetchWords();
        
        const chars = [...args[0]]; // position
        const possible = [...args[1]]; // any possible characters

        const results: string[] = [];

        if (words.length === 0) {
            return this.Embed.fail(`An error occurred parsing the word list!`);
        }

        for (const word of words) {
            // mismatched length
            if (word.length !== chars.length) continue;
            const s = [...possible];

            if (chars.every((c, i) => c === '?' || c === word[i])) {
                const every = [...word].every(c => {
                    const has = s.includes(c);
                    if (has) s.splice(s.indexOf(c), 1);
                    return has;
                });

                if (every) {
                    results.push(word);
                }
            }
        }

        const attachment = new MessageAttachment(Buffer.from(results.join('\n')), 'words.txt');

        return attachment;
    }
}
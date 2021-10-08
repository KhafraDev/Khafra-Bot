import { Command } from '../../../Structures/Command.js';
import { thisWordDoesNotExist } from '../../../lib/Packages/ThisWordDoesNotExist.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { bold, hyperlink, inlineCode, italic, underscore } from '@discordjs/builders';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'This word does not exist!'
            ],
			{
                name: 'thisworddoesnotexist',
                folder: 'Fun',
                args: [0, 0],
                ratelimit: 7,
                aliases: [ 'thisworddoesn\'texist', 'twdne' ]
            }
        );
    }

    async init() {
        const word = await thisWordDoesNotExist();

        if (word === null) {
            return this.Embed.fail(`Failed to get a word, try again!`);
        }

        return this.Embed.success(`
        ${bold(word.word.word.toUpperCase())} - ${word.word.pos}
        ${italic(word.word.syllables.join(' − '))}
        ${inlineCode(word.word.definition)}
        ${word.word.example ? italic(underscore(word.word.example)) : ''}

        ${hyperlink('View Online', word.permalink_url)}
        `);
    }
}
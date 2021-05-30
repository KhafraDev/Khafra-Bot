import { Command } from '../../../Structures/Command.js';
import { thisWordDoesNotExist } from '../../../lib/Packages/ThisWordDoesNotExist.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

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

        return this.Embed.success(`
        **${word.word.word.toUpperCase()}** - ${word.word.pos}
        *${word.word.syllables.join(' − ')}*
        \`\`${word.word.definition}\`\`
        ${word.word.example ? `*__${word.word.example}__*` : ''}

        [View Online](${word.permalink_url}).
        `);
    }
}
import { Message } from 'discord.js';
import { Command, Arguments } from '#khaf/Command';
import { owlbotio } from '#khaf/utility/commands/OwlBotIO';

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Define a word!',
                'credit card', 'cat', 'juice'
            ],
			{
                name: 'define',
                folder: 'Utility',
                args: [1],
                aliases: [ 'definition', 'dict', 'dictionary' ],
                errors: {
                    OwlBotError: `Command hasn't been setup by the bot owner.`
                }
            }
        );
    }

    async init(_message: Message, { args }: Arguments) {
        const word = await owlbotio(args.join(' '));

        if (word?.definitions == null) {
            return this.Embed.error('No definition found!');
        }

        return this.Embed.ok(`
        **${word.word}** ${word.pronunciation ? `(${word.pronunciation})` : ''}
        ${word.definitions
            .map(w => `*${w.type}* - ${w.definition}${w.emoji ? ` ${w.emoji}` : ''}`)
            .join('\n')
            .slice(0, 2048 - word.word.length - (word.pronunciation ? word.pronunciation.length + 2 : 0))
        }
        `);
    }
}
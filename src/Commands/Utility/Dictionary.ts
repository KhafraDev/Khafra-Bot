import { Message } from 'discord.js';
import { Command } from '../../Structures/Command.js';
import { owlbotio } from '../../lib/Backend/OwlBotIO.js';

export default class extends Command {
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
                aliases: [ 'definition', 'dict', 'dictionary' ]
            }
        );
    }

    async init(message: Message, args: string[]) {
        let word;
        try {
            word = await owlbotio(args.join(' '));
        } catch(e) {
            if(e.name === 'OwlBotError') {
                return message.reply(this.Embed.fail(`Command hasn't been setup by the bot owner.`));
            } else if(e.name === 'FetchError') {
                return message.reply(this.Embed.fail('Server failed to process this request!'));
            }

            return message.reply(this.Embed.fail('An unexpected error occurred!'));
        }

        if(typeof word.definitions === 'undefined') {
            return message.reply(this.Embed.fail('No definition found!'));
        }

        return message.reply(this.Embed.success(`
        **${word.word}** ${word.pronunciation ? `(${word.pronunciation})` : ''}
        ${word.definitions
            .map(w => `*${w.type}* - ${w.definition}${w.emoji ? ` ${w.emoji}` : ''}`)
            .join('\n')
            .slice(0, 2048 - word.word.length - (word.pronunciation ? word.pronunciation.length + 2 : 0))
        }
        `));
    }
}

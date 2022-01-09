import { ChatInputCommandInteraction } from 'discord.js';
import { Interactions } from '#khaf/Interaction';
import { bold, italic } from '@khaf/builders';
import { owlbotio } from '#khaf/utility/commands/OwlBotIO';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'dictionary',
            description: 'Gets the definition of a word or phrase!',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'word',
                    description: 'The word or phrase to define.',
                    required: true
                }
            ]
        };

        super(sc);
    }

    async init(interaction: ChatInputCommandInteraction) {
        const phrase = interaction.options.getString('word', true);
        const word = await owlbotio(phrase);

        if (word?.definitions === undefined) {
            return '❌ No definition found!';
        }

        return `
        ${bold(word.word)} ${word.pronunciation ? `(${word.pronunciation})` : ''}
        ${word.definitions
            .map(w => `${italic(w.type)} - ${w.definition}${w.emoji ? ` ${w.emoji}` : ''}`)
            .join('\n')
            .slice(0, 2048 - word.word.length - (word.pronunciation ? word.pronunciation.length + 2 : 0))
        }
        `.trim();
    }
} 
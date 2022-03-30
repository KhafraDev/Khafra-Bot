import { Interactions } from '#khaf/Interaction';
import { thisSimpsonDoesNotExist } from '#khaf/utility/commands/Simpson';
import type { DNE} from '#khaf/utility/commands/ThisDoesNotExist';
import { thisDoesNotExist } from '#khaf/utility/commands/ThisDoesNotExist';
import { thisWordDoesNotExist } from '#khaf/utility/commands/ThisWordDoesNotExist';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { bold, hyperlink, inlineCode, italic, underscore } from '@discordjs/builders';
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ApplicationCommandOptionType } from 'discord-api-types/v10';
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';

export class kInteraction extends Interactions {
    constructor () {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'thisdoesnotexist',
            description: 'Get an AI generated picture of a person or item that doesn\'t exist!',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'type',
                    description: 'Type of image to get.',
                    required: true,
                    choices: [
                        { name: 'artwork', value: 'tdne_artwork' },
                        { name: 'cat', value: 'tdne_cat' },
                        { name: 'fucked up homer', value: 'tdne_fuhomer' },
                        { name: 'horse', value: 'tdne_horse' },
                        { name: 'person', value: 'tdne_person' },
                        { name: 'word', value: 'tdne_word' }
                    ]
                }
            ]
        }

        super(sc);
    }

    async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const type = interaction.options.getString('type', true);
        if (type === 'tdne_fuhomer') {
            const [err, homer] = await dontThrow(thisSimpsonDoesNotExist());

            if (err !== null) {
                return {
                    content: '❌ An unexpected error occurred getting a Homer!',
                    ephemeral: true
                }
            }

            return {
                embeds: [
                    Embed.ok().setImage(homer)
                ]
            }
        } else if (type === 'tdne_word') {
            const [err, word] = await dontThrow(thisWordDoesNotExist());

            if (err !== null || word === null) {
                return {
                    content: '❌ An unexpected error occurred getting a word!',
                    ephemeral: true
                }
            }

            const embed = Embed.ok(`
            ${bold(word.word.word.toUpperCase())} - ${word.word.pos}
            ${italic(word.word.syllables.join(' − '))}
            ${inlineCode(word.word.definition)}
            ${word.word.example ? `${italic(underscore(word.word.example))}` : ''}

            ${hyperlink('View Online', word.permalink_url)}
            `);

            return { embeds: [embed] }
        } else {
            const [err, image] = await dontThrow(thisDoesNotExist(type.split('_')[1] as DNE));

            if (err !== null || image === null) {
                return {
                    content: '❌ Not yet implemented or an error occurred!',
                    ephemeral: true
                }
            }

            return image as InteractionReplyOptions;
        }
    }
}
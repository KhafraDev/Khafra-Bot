import { ChatInputCommandInteraction } from 'discord.js';
import { Interactions } from '#khaf/Interaction';
import {
    GoogleTranslate,
    GoogleLanguages,
    LibreTranslate,
    LibreTranslateGetLanguages
} from '@khaf/translate'; 
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { type Embed as MessageEmbed } from '@khaf/builders';

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'translate',
            description: 'Use Google Translate to translate some text!',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'engine',
                    description: 'The translating service to use.',
                    required: true,
                    choices: [
                        { name: 'LibreTranslate', value: 'libretranslate' },
                        { name: 'Google Translate', value: 'googletranslate' }
                    ]
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'text',
                    description: 'Text to translate.',
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'to',
                    description: 'Language code to translate to (default: "en").'
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'from',
                    description: 'Language code to translate from (default: "from").'
                }
            ]
        };

        super(sc, { defer: true });
    }

    async init(interaction: ChatInputCommandInteraction): Promise<MessageEmbed | string | undefined> {
        const to = interaction.options.getString('to');
        const from = interaction.options.getString('from');
        const text = interaction.options.getString('text', true);
        const engine = interaction.options.getString('engine', true);

        const embed = Embed.ok().setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL()
        });

        if (engine === 'googletranslate') {
            const translated = await GoogleTranslate(
                text,
                {
                    to: to && GoogleLanguages.includes(to.toLowerCase())
                        ? to.toLowerCase()
                        : 'es',
                    from: from && GoogleLanguages.includes(from.toLowerCase())
                        ? from.toLowerCase()
                        : 'auto'
                }
            );

            return embed.setDescription(translated);
        } else if (engine === 'libretranslate') {
            const supported = await LibreTranslateGetLanguages();
            const translated = await LibreTranslate({
                query: text,
                to: to && supported.includes(to.toLowerCase())
                    ? to.toLowerCase()
                    : 'es',
                from: from && supported.includes(from.toLowerCase())
                    ? from.toLowerCase()
                    : 'en'
            });

            if (translated === null) {
                return `❌ An error occurred using LibreTranslate, try another service!`;
            }

            return embed.setDescription(translated.translatedText);
        }
    }
} 
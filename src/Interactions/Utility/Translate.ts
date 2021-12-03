import { CommandInteraction } from 'discord.js';
import { Interactions } from '../../Structures/Interaction.js';
import { translate, langs } from '../../lib/Packages/Translate.js';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'translate',
            description: 'Use Google Translate to translate some text!',
            options: [
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

    async init(interaction: CommandInteraction) {
        const to = interaction.options.getString('to') ?? 'en';
        const from = interaction.options.getString('from') ?? 'auto';
        const text = interaction.options.getString('text', true);
        
        const translated = await translate(
            text,
            {
                to: langs.includes(to.toLowerCase()) ? to.toLowerCase() : 'en',
                from: langs.includes(from.toLowerCase()) ? from.toLowerCase() : 'auto'
            }
        );

        return Embed.success()
            .setDescription(translated)
            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() });
    }
} 
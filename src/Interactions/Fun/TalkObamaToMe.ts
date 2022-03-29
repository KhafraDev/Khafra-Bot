import { Interactions } from '#khaf/Interaction';
import { talkObamaToMe } from '#khaf/utility/commands/TalkObamaToMe';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { inlineCode } from '@discordjs/builders';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ChatInputCommandInteraction } from 'discord.js';

export class kInteraction extends Interactions {
    constructor () {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'talkobamatome',
            description: 'Have Obama say something.',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'sentence',
                    description: 'The sentence that you want Obama to speak.',
                    required: true
                }
            ]
        };

        super(sc);
    }

    async init (interaction: ChatInputCommandInteraction): Promise<string> {
        const sentence = interaction.options.getString('sentence', true);
        const [barack, obama] = await dontThrow(talkObamaToMe(sentence.slice(0, 280)));

        if (barack !== null) {
            return `❌ An unexpected error occurred: ${inlineCode(barack.message)}`;
        }

        return obama;
    }
}
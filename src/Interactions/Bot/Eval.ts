import { Interactions } from '#khaf/Interaction';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { codeBlock } from '@khaf/builders';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import { inspect } from 'util';
import { createContext, runInContext } from 'vm';

export class kInteraction extends Interactions {
    constructor () {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'eval',
            description: 'Evaluate some javascript!',
            default_permission: false,
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'string',
                    description: 'Text to evaluate.',
                    required: true
                }
            ]
        };

        super(sc, {
            ownerOnly: true
        });
    }

    async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const text = interaction.options.getString('string', true);

        const context = createContext({ interaction });
        let ret: unknown;

        try {
            ret = runInContext(text, context);
        } catch (e) {
            ret = e;
        }

        const inspected = inspect(ret, true, 1, false);
        const embed = Embed.ok(`${codeBlock('js', inspected.slice(0, 2004).trim())}`);

        return {
            ephemeral: true,
            embeds: [embed]
        } as InteractionReplyOptions;
    }
} 
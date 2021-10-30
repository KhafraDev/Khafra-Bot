import { CommandInteraction, InteractionReplyOptions, MessageAttachment } from 'discord.js';
import { Interactions } from '../../Structures/Interaction.js';
import { inlineCode } from '@discordjs/builders';
import { fetch } from 'undici';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'qr',
            description: 'Gets the QR code for some text.',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'input',
                    description: 'Text to get a QR code for.',
                    required: true
                }
            ]
        };

        super(sc, { defer: true });
    }

    async init(interaction: CommandInteraction) {
        const text = interaction.options.getString('input', true);
        const [e, r] = await dontThrow(fetch(`https://qrcode.show/${text}`, {
            headers: {
                Accept: 'image/png'
            }
        }));

        if (e !== null) {
            return `❌ An unexpected error occurred: ${inlineCode(e.message)}.`;
        }

        const attachment = new MessageAttachment(await r.blob(), 'qr.png');

        return {
            files: [attachment]
        } as InteractionReplyOptions;
    }
} 
import { Interactions } from '#khaf/Interaction';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { inlineCode } from '@khaf/builders';
import { Buffer } from 'buffer';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { ChatInputCommandInteraction, InteractionReplyOptions, MessageAttachment } from 'discord.js';
import { fetch } from 'undici';

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

    async init(interaction: ChatInputCommandInteraction) {
        const text = interaction.options.getString('input', true);
        const [e, r] = await dontThrow(fetch(`https://qrcode.show/${text}`, {
            headers: {
                Accept: 'image/png'
            }
        }));

        if (e !== null) {
            return `❌ An unexpected error occurred: ${inlineCode(e.message)}.`;
        }

        const buffer = Buffer.from(await r.arrayBuffer());
        const attachment = new MessageAttachment(buffer, 'qr.png')
            .setDescription(`A QR Code!`);

        return {
            files: [attachment]
        } as InteractionReplyOptions;
    }
} 
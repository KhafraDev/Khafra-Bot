import { Interactions } from '#khaf/Interaction';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { inlineCode } from '@discordjs/builders';
import { Buffer } from 'buffer';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ChatInputCommandInteraction, InteractionReplyOptions, MessageAttachment } from 'discord.js';
import { request } from 'undici';

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

    async init(interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const text = interaction.options.getString('input', true);
        const [e, r] = await dontThrow(request(`https://qrcode.show/${text}`, {
            headers: {
                Accept: 'image/png'
            }
        }));

        if (e !== null) {
            return {
                content: `❌ An unexpected error occurred: ${inlineCode(e.message)}.`,
                ephemeral: true
            }
        }

        const buffer = Buffer.from(await r.body.arrayBuffer());
        const attachment = new MessageAttachment(buffer, 'qr.png')
            .setDescription('A QR Code!');

        return {
            files: [attachment]
        }
    }
}
import { Interactions } from '#khaf/Interaction';
import { qrcodeImage } from '@khaf/qrcode';
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ApplicationCommandOptionType } from 'discord-api-types/v10';
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import { Buffer } from 'node:buffer';

export class kInteraction extends Interactions {
    constructor () {
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

    async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const text = interaction.options.getString('input', true);
        const qrcode = Buffer.from(qrcodeImage(text), text.length);

        return {
            files: [{
                attachment: qrcode,
                name: 'qr.png',
                description: 'A QR Code!'
            }]
        }
    }
}
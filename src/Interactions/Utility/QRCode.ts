import { Interactions } from '#khaf/Interaction';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { inlineCode } from '@discordjs/builders';
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ApplicationCommandOptionType } from 'discord-api-types/v10';
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import { Buffer } from 'node:buffer';
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

        return {
            files: [{
                attachment: buffer,
                name: 'qr.png',
                description: 'A QR Code!'
            }]
        }
    }
}
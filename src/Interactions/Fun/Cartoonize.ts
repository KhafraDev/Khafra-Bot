import { Interactions } from '#khaf/Interaction';
import { Cartoonize } from '#khaf/utility/commands/Cartoonize';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ApplicationCommandOptionType } from 'discord-api-types/v10';
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import { Buffer } from 'node:buffer';
import { request } from 'undici';

export class kInteraction extends Interactions {
    constructor () {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'cartoonize',
            description: 'Use AI to cartoonize an image.',
            options: [
                {
                    type: ApplicationCommandOptionType.Attachment,
                    name: 'image',
                    description: 'The image to cartoonize.',
                    required: true
                }
            ]
        };

        super(sc, {
            defer: true
        });
    }

    async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const image = interaction.options.getAttachment('image', true);
        const cartoon = await Cartoonize.cartoonize(image);

        if (!cartoon) {
            return {
                embeds: [
                    Embed.error('Failed to extract the image from the HTML. 😕')
                ]
            }
        }

        const { body } = await request(cartoon);
        const imageBuffer = Buffer.from(await body.arrayBuffer());

        return {
            embeds: [
                Embed.json({
                    description: `[Click Here](${cartoon}) to download (link is only valid for a few minutes)!`,
                    image: { url: 'attachment://cartoonized.jpeg' }
                })
            ],
            files: [{
                attachment: imageBuffer,
                name: 'cartoonized.jpeg'
            }]
        }
    }
}
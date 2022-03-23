import { Interactions } from '#khaf/Interaction';
import { Cartoonize } from '#khaf/utility/commands/Cartoonize';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { type UnsafeEmbed } from '@discordjs/builders';
import { Buffer } from 'buffer';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ChatInputCommandInteraction, InteractionReplyOptions, MessageAttachment } from 'discord.js';
import { fetch } from 'undici';

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

    async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | UnsafeEmbed> {
        const image = interaction.options.getAttachment('image', true);
        const cartoon = await Cartoonize.cartoonize(image);

        if (!cartoon) {
            return Embed.error('Failed to extract the image from the HTML. 😕');
        }

        const imageRes = await fetch(cartoon);
        const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
        const attachment = new MessageAttachment(imageBuffer, 'cartoonized.jpeg');

        return {
            embeds: [
                Embed
                    .ok(`[Click Here](${cartoon}) to download (link is only valid for a few minutes)!`)
                    .setImage('attachment://cartoonized.jpeg')
            ],
            files: [attachment]
        }
    }
}
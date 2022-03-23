import { InteractionSubCommand } from '#khaf/Interaction';
import { templates } from '#khaf/utility/Constants/Path.js';
import { ImageUtil } from '#khaf/utility/ImageUtil.js';
import { createCanvas, Image } from '@napi-rs/canvas';
import { Buffer } from 'buffer';
import { ChatInputCommandInteraction, MessageAttachment } from 'discord.js';
import { readFileSync } from 'fs';

let image: Image | undefined;

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'memes',
            name: 'megamind'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<MessageAttachment | string> {
        const buffer = await this.image(interaction);

        return new MessageAttachment(buffer, 'no_beaches.png');
    }

    async image (interaction: ChatInputCommandInteraction): Promise<Buffer> {
        if (!image) {
            image = new Image();
            image.src = readFileSync(templates('megamind.png'));
        }

        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(image, 0, 0);
        ctx.font = '50px Impact';
        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const text = interaction.options.getString('text', true);
        const lines = ImageUtil.split(text, image.width, ctx);

        for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
            ctx.fillText(
                lines[lineIdx],
                canvas.width / 2,
                35 + (50 * lineIdx),
                canvas.width
            );
        }

        return canvas.toBuffer('image/png');
    }
}
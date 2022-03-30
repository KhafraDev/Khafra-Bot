import { InteractionSubCommand } from '#khaf/Interaction';
import { templates } from '#khaf/utility/Constants/Path.js';
import { ImageUtil } from '#khaf/utility/ImageUtil.js';
import { Buffer } from 'buffer';
import { createCanvas, Image } from '@napi-rs/canvas';
import { ChatInputCommandInteraction, InteractionReplyOptions, MessageAttachment } from 'discord.js';
import { readFileSync } from 'fs';
import { request } from 'undici';

let image: Image | undefined;

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'memes',
            name: 'watching_until_i_laugh'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const buffer = await this.image(interaction);

        if (typeof buffer === 'string') {
            return { content: buffer }
        }

        return {
            files: [
                new MessageAttachment(buffer, 'so_funny.png')
            ]
        }
    }

    async image (interaction: ChatInputCommandInteraction): Promise<Buffer | string> {
        const thumbnail = interaction.options.getAttachment('image', true);
        const title = interaction.options.getString('title', true);

        if (!ImageUtil.isImage(thumbnail.proxyURL)) {
            return '❌ This file type is not supported.';
        }

        const canvas = createCanvas(374, 289);
        const ctx = canvas.getContext('2d');

        if (!image) {
            image = new Image();
            image.width = 374;
            image.height = 289;
            image.src = readFileSync(templates('watchinguntillaugh.png'));
        }

        const { body } = await request(thumbnail.proxyURL);
        const b = Buffer.from(await body.arrayBuffer());

        const avatar = new Image();
        avatar.width = avatar.height = 256;
        avatar.src = b;

        ctx.drawImage(image, 0, 0);
        ctx.drawImage(avatar, 7, 97, 210, 112);

        ctx.font = 'normal 500 16.2px Roboto';
        ctx.fillStyle = 'rgb(255, 255, 255)';
        const text = ImageUtil.maxTextLength(title, 280, ctx);
        ctx.fillText(text, 56, 238);

        return canvas.toBuffer('image/png');
    }
}
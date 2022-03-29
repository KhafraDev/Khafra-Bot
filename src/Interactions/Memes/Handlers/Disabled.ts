import { InteractionSubCommand } from '#khaf/Interaction';
import { templates } from '#khaf/utility/Constants/Path.js';
import { ImageUtil } from '#khaf/utility/ImageUtil.js';
import { createCanvas, Image } from '@napi-rs/canvas';
import { Buffer } from 'buffer';
import { ChatInputCommandInteraction, InteractionReplyOptions, MessageAttachment } from 'discord.js';
import { readFileSync } from 'fs';
import { request } from 'undici';

let image: Image | undefined;

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'memes',
            name: 'disabled'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<MessageAttachment | InteractionReplyOptions> {
        const buffer = await this.image(interaction);

        if (typeof buffer === 'string') {
            return { content: buffer }
        }

        return new MessageAttachment(buffer, 'disabled.png');
    }

    async image (interaction: ChatInputCommandInteraction): Promise<Buffer | string> {
        const attachment = interaction.options.getAttachment('image', true);

        if (!ImageUtil.isImage(attachment.proxyURL)) {
            return '❌ This file type is not supported.';
        }

        const canvas = createCanvas(577, 538);
        const ctx = canvas.getContext('2d');

        if (!image) {
            image = new Image();
            image.width = 577;
            image.height = 538;
            image.src = readFileSync(templates('disabilities.png'));
        }

        const { body } = await request(attachment.proxyURL);
        const b = Buffer.from(await body.arrayBuffer());

        const avatar = new Image();
        avatar.width = avatar.height = 256;
        avatar.src = b;

        ctx.drawImage(image, 0, 0);
        ctx.drawImage(avatar, 390, 315, 128, 128);

        return canvas.toBuffer('image/png');
    }
}
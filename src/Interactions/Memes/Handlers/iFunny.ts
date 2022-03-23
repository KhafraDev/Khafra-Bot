import { InteractionSubCommand } from '#khaf/Interaction';
import { templates } from '#khaf/utility/Constants/Path.js';
import { ImageUtil } from '#khaf/utility/ImageUtil.js';
import { createCanvas, Image } from '@napi-rs/canvas';
import { Buffer } from 'buffer';
import { ChatInputCommandInteraction, MessageAttachment } from 'discord.js';
import { readFileSync } from 'fs';
import { fetch } from 'undici';

let image: Image | undefined;

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'memes',
            name: 'ifunny'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<MessageAttachment | string> {
        const buffer = await this.image(interaction);

        if (typeof buffer === 'string') {
            return buffer;
        }

        return new MessageAttachment(buffer, 'ifunny.png');
    }

    async image (interaction: ChatInputCommandInteraction): Promise<Buffer | string> {
        const attachment = interaction.options.getAttachment('image', true);

        if (!ImageUtil.isImage(attachment.proxyURL)) {
            return '❌ This file type is not supported.';
        }

        const canvas = createCanvas(256, 256 + 22);
        const ctx = canvas.getContext('2d');

        if (!image) {
            image = new Image();
            image.width = image.height = 256;
            image.src = readFileSync(templates('iFunny.png'));
        }

        ctx.drawImage(image, 0, 0);

        const r = await fetch(attachment.proxyURL);
        const b = Buffer.from(await r.arrayBuffer());

        const avatar = new Image();
        avatar.width = avatar.height = 256;
        avatar.src = b;

        ctx.drawImage(avatar, 0, 0, 256, 256);
        ctx.drawImage(image, 0, 256, 256, 22);

        return canvas.toBuffer('image/png');
    }
}
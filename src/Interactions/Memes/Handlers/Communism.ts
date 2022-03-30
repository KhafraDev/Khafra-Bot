import { KhafraClient } from '#khaf/Bot';
import { InteractionSubCommand } from '#khaf/Interaction';
import { templates } from '#khaf/utility/Constants/Path.js';
import { createCanvas, Image } from '@napi-rs/canvas';
import { GifEncoder } from '@skyra/gifenc';
import { Buffer } from 'buffer';
import { ChatInputCommandInteraction, InteractionReplyOptions, MessageAttachment } from 'discord.js';
import { readFileSync } from 'fs';
import { buffer } from 'stream/consumers';
import { request } from 'undici';

// Descriptive comment.
const TWO_FIFTY_SIX = 256;
const imagePaths = KhafraClient.walk(templates('communism'), (p) => p.endsWith('.png'));
const imageCache = new Map<string, Image>();

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'memes',
            name: 'communism'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const user = interaction.options.getUser('person') ?? interaction.user;
        const avatarURL = user.displayAvatarURL({ extension: 'png', size: TWO_FIFTY_SIX });

        const buffer = await this.image(avatarURL);

        return {
            files: [
                new MessageAttachment(buffer, 'communism.gif')
            ]
        }
    }

    async image (avatarURL: string): Promise<Buffer> {
        const { body } = await request(avatarURL);
        const b = Buffer.from(await body.arrayBuffer());

        const avatar = new Image();
        avatar.width = avatar.height = TWO_FIFTY_SIX;
        avatar.src = b;

        const encoder = new GifEncoder(TWO_FIFTY_SIX, TWO_FIFTY_SIX)
            .setRepeat(0)
            .setDelay(20)
            .setQuality(100);

        const stream = encoder.createReadStream();
        encoder.start();

        const canvas = createCanvas(TWO_FIFTY_SIX, TWO_FIFTY_SIX);
        const ctx = canvas.getContext('2d');

        for (const imagePath of imagePaths) {
            let img = imageCache.get(imagePath);

            if (!img) {
                img = new Image();
                img.width = img.height = TWO_FIFTY_SIX;
                img.src = readFileSync(imagePath);

                imageCache.set(imagePath, img);
            }

            ctx.globalAlpha = 1;
            ctx.drawImage(avatar, 0, 0);
            ctx.globalAlpha = 0.5;
            ctx.drawImage(img, 0, 0, 256, 256);

            const bytes = ctx.getImageData(0, 0, 256, 256).data;
            encoder.addFrame(bytes);
        }

        encoder.finish();

        return await buffer(stream);
    }
}
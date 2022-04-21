import { InteractionSubCommand } from '#khaf/Interaction';
import { templates } from '#khaf/utility/Constants/Path.js';
import { createCanvas, Image } from '@napi-rs/canvas';
import { GifEncoder } from '@skyra/gifenc';
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { buffer } from 'node:stream/consumers';
import { request } from 'undici';

const Dims = {
    Width: 256,
    Height: 256,
    Template: 40
} as const;

let image: Image | undefined;
const coords =  [
    [0, 0],
    [-5, -5],
    [-10, -5],
    [-20, -15],
    [-15, 0]
] as const;

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'memes',
            name: 'triggered'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const user = interaction.options.getUser('person', true);
        const avatarURL = user.displayAvatarURL({ extension: 'png', size: 256 });

        const buffer = await this.image(avatarURL);

        return {
            files: [
                {
                    attachment: buffer,
                    name: 'triggered.gif'
                }
            ]
        }
    }

    async image (avatarURL: string): Promise<Buffer> {
        if (!image) {
            image = new Image();
            image.width = Dims.Width;
            image.height = Dims.Template;
            image.src = readFileSync(templates('triggered.png'));
        }

        const { body } = await request(avatarURL);
        const b = Buffer.from(await body.arrayBuffer());

        const avatar = new Image();
        avatar.width = Dims.Width;
        avatar.height = Dims.Height;
        avatar.src = b;

        const encoder = new GifEncoder(Dims.Width, Dims.Height + Dims.Template)
            .setRepeat(0)
            .setDelay(50)
            .setQuality(100);

        const stream = encoder.createReadStream();
        encoder.start();

        const canvas = createCanvas(Dims.Width, Dims.Height + Dims.Template);
        const ctx = canvas.getContext('2d');

        for (const [x, y] of coords) {
            // We need to draw the image larger than it actually is,
            // and larger than the template, to prevent parts of the gif
            // from being empty.
            ctx.drawImage(avatar, x, y, 300, 300);
            ctx.drawImage(
                image,
                0,
                Dims.Width,
                Dims.Height,
                Dims.Template
            );
            ctx.fillStyle = 'rgba(255, 100, 0, 0.35)';
            ctx.fillRect(0, 0, Dims.Width, Dims.Height);
            const bytes = ctx.getImageData(0, 0, Dims.Width, Dims.Height + Dims.Template).data;
            encoder.addFrame(bytes);
        }

        encoder.finish();

        return await buffer(stream);
    }
}
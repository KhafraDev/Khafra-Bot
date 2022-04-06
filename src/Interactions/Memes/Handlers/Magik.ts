import { ImageUtil } from '#khaf/image/ImageUtil.js';
import { InteractionSubCommand } from '#khaf/Interaction';
import { once } from '#khaf/utility/Memoize.js';
import { Range } from '#khaf/utility/Valid/Number.js';
import type { ImageURLOptions } from '@discordjs/rest';
import { ImageMagick, initializeImageMagick } from '@imagemagick/magick-wasm';
import { MagickFormat } from '@imagemagick/magick-wasm/magick-format.js';
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import { MessageAttachment } from 'discord.js';
import { Buffer } from 'node:buffer';
import { request } from 'undici';

const options: ImageURLOptions = { extension: 'png', size: 256 };
const mw = once(initializeImageMagick);
const dimensionRange = Range({ min: 1, max: 1024 });

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'memes',
            name: 'magik'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const option =
			interaction.options.getAttachment('image') ??
			interaction.options.getUser('person')?.displayAvatarURL(options) ??
			interaction.user.displayAvatarURL(options);

        const buffer = await this.image(option);

        if (typeof buffer === 'string') {
            return { content: buffer }
        }

        return {
            files: [
                new MessageAttachment(Buffer.from(buffer), 'magik.png')
            ]
        }
    }

    async image (avatarURL: string | MessageAttachment): Promise<Uint8Array | string> {
        if (typeof avatarURL === 'string') {
            if (!ImageUtil.isImage(avatarURL)) {
            	return '❌ This file type is not supported.';
            }
        } else {
            const { width, height, proxyURL } = avatarURL;

            if (!ImageUtil.isImage(proxyURL)) {
                return '❌ This file type is not supported.';
            } else if (!dimensionRange(width!) || !dimensionRange(height!)) {
                return '❌ The max width and height is 1024 pixels.';
            }
        }

        const { body } = await request(typeof avatarURL === 'string' ? avatarURL : avatarURL.proxyURL);
        const buffer = new Uint8Array(await body.arrayBuffer());

        const init = await mw();

        if (init === null) return this.image(avatarURL);

        return new Promise<Uint8Array>((res) => {
            ImageMagick.read(buffer, (image) => {
                image.liquidRescale(image.width * .5, image.height * .5);
                image.liquidRescale(image.width * 1.5, image.height * 1.5);
                image.resize(256, 256);

                image.write(res, MagickFormat.Png);
            });
        });
    }
}
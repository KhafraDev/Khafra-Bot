import { ImageUtil } from '#khaf/image/ImageUtil.js'
import { InteractionSubCommand } from '#khaf/Interaction'
import { logError } from '#khaf/utility/Rejections.js'
import type { ImageURLOptions } from '@discordjs/rest'
import { magik } from '@khaf/magik'
import { s } from '@sapphire/shapeshift'
import type { Attachment, ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { Buffer } from 'node:buffer'
import { request } from 'undici'

const options: ImageURLOptions = { extension: 'png', size: 256 }
const schema = s.number.greaterThan(1).lessThanOrEqual(1024)

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'memes',
            name: 'magik'
        })
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const option =
			interaction.options.getAttachment('image') ??
			interaction.options.getUser('person')?.displayAvatarURL(options) ??
			interaction.user.displayAvatarURL(options)

        try {
            const buffer = await this.image(option)

            if (typeof buffer === 'string') {
                return { content: buffer, ephemeral: true }
            }

            return {
                files: [
                    {
                        attachment: Buffer.from(buffer, buffer.byteOffset, buffer.byteLength),
                        name: 'magik.png'
                    }
                ]
            }
        } catch (e) {
            if (e instanceof Error) {
                logError(e)
            }

            return {
                content: '❌ An unexpected error occurred',
                ephemeral: true
            }
        }
    }

    async image (avatarURL: string | Attachment): Promise<Uint8ClampedArray | string> {
        if (typeof avatarURL === 'string') {
            if (!ImageUtil.isImage(avatarURL)) {
            	return '❌ This file type is not supported.'
            }
        } else {
            const { width, height, proxyURL } = avatarURL

            if (!ImageUtil.isImage(proxyURL)) {
                return '❌ This file type is not supported.'
            } else if (!schema.is(width) || !schema.is(height)) {
                return '❌ The max width and height is 1024 pixels.'
            }
        }

        const { body } = await request(typeof avatarURL === 'string' ? avatarURL : avatarURL.proxyURL)
        const buffer = new Uint8Array(await body.arrayBuffer())

        return magik(buffer)
    }
}
import { ImageUtil } from '#khaf/image/ImageUtil.mjs'
import { InteractionSubCommand } from '#khaf/Interaction'
import { seconds } from '#khaf/utility/ms.mjs'
import { arrayBufferToBuffer } from '#khaf/utility/util.mjs'
import type { ImageURLOptions } from '@discordjs/rest'
import { Magik } from '@khaf/magik'
import { Transformer } from '@napi-rs/image'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { Buffer } from 'node:buffer'
import { request } from 'undici'

const options: ImageURLOptions = { extension: 'png', size: 256 }

export class kSubCommand extends InteractionSubCommand {
  constructor () {
    super({
      references: 'memes',
      name: 'magik'
    })
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const attachment = interaction.options.getAttachment('image')
    const option = attachment?.proxyURL
      ?? interaction.options.getUser('person')?.displayAvatarURL(options)
      ?? interaction.user.displayAvatarURL(options)

    if (!ImageUtil.isImage(option, attachment?.contentType)) {
      return {
        content: 'What am I supposed to do with that? That\'s not an image!',
        ephemeral: true
      }
    }

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
  }

  async image (avatarURL: string): Promise<Uint8ClampedArray | string> {
    const { body } = await request(avatarURL)
    const buffer = arrayBufferToBuffer(await body.arrayBuffer())

    const transformer = new Transformer(buffer)
    const { width, height } = await transformer.metadata()

    if (width > 1024 || height > 1024) {
      transformer.resize({
        width: Math.min(1024, width),
        height: Math.min(1024, height)
      })
    }

    const ac = new AbortController()
    const timeout = setTimeout(() => ac.abort(), seconds(60))
    const magik = new Magik(await transformer.png())
    const image = await magik.magikify(ac.signal)

    clearTimeout(timeout)

    return image
  }
}

import { ImageUtil } from '#khaf/image/ImageUtil.mjs'
import { InteractionSubCommand } from '#khaf/Interaction'
import { templates } from '#khaf/utility/Constants/Path.mjs'
import { arrayBufferToBuffer } from '#khaf/utility/util.mjs'
import { Transformer } from '@napi-rs/image'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import type { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import { request } from 'undici'

export class kSubCommand extends InteractionSubCommand {
  constructor () {
    super({
      references: 'memes',
      name: 'ifunny'
    })
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const buffer = await this.image(interaction)

    if (typeof buffer === 'string') {
      return { content: buffer, ephemeral: true }
    }

    return {
      files: [
        {
          attachment: buffer,
          name: 'ifunny.png'
        }
      ]
    }
  }

  async image (interaction: ChatInputCommandInteraction): Promise<Buffer | string> {
    const attachment = interaction.options.getAttachment('image', true)

    if (!ImageUtil.isImage(attachment.proxyURL, attachment.contentType)) {
      return '❌ This file type is not supported.'
    }

    const width = 256
    const height = 256 + 22

    const { body } = await request(attachment.proxyURL)
    const b = arrayBufferToBuffer(await body.arrayBuffer())

    const resized = await new Transformer(b)
      .fastResize({ width, height: width })
      .png()

    const logo = await new Transformer(await readFile(templates('iFunny.png')))
      .fastResize({ width, height: height - width })
      .png()

    return await Transformer.fromRgbaPixels(
      new Uint8Array(width * height * 4) as Buffer,
      width,
      height
    )
      .overlay(resized, 0, 0)
      .overlay(logo, 0, width)
      .png()
  }
}

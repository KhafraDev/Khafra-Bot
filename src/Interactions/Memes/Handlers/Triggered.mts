import { InteractionSubCommand } from '#khaf/Interaction'
import { templates } from '#khaf/utility/Constants/Path.mjs'
import { once } from '#khaf/utility/Memoize.mjs'
import { arrayBufferToBuffer } from '#khaf/utility/util.mjs'
import { createCanvas, Image } from '@napi-rs/canvas'
import { GifEncoder } from '@skyra/gifenc'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import type { Buffer } from 'node:buffer'
import { readFileSync } from 'node:fs'
import { buffer } from 'node:stream/consumers'
import { request } from 'undici'

const Dims = {
  Width: 256,
  Height: 256,
  Template: 40
} as const

const coords = [
  [0, 0],
  [-5, -5],
  [-10, -5],
  [-20, -15],
  [-15, 0]
] as const

const lazyImage = once(() => {
  const image = new Image(Dims.Width, Dims.Template)
  image.src = readFileSync(templates('triggered.png'))

  return image
})

export class kSubCommand implements InteractionSubCommand {
  data = {
    references: 'memes',
    name: 'triggered'
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const user = interaction.options.getUser('person', true)
    const avatarURL = user.displayAvatarURL({ extension: 'png', size: 256 })

    const buffer = await this.image(avatarURL)

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
    const { body } = await request(avatarURL)
    const b = arrayBufferToBuffer(await body.arrayBuffer())

    const avatar = new Image()
    avatar.width = Dims.Width
    avatar.height = Dims.Height
    avatar.src = b

    const encoder = new GifEncoder(Dims.Width, Dims.Height + Dims.Template)
      .setRepeat(0)
      .setDelay(50)
      .setQuality(100)

    const stream = encoder.createReadStream()
    encoder.start()

    const canvas = createCanvas(Dims.Width, Dims.Height + Dims.Template)
    const ctx = canvas.getContext('2d')
    const image = lazyImage()

    for (const [x, y] of coords) {
      // We need to draw the image larger than it actually is,
      // and larger than the template, to prevent parts of the gif
      // from being empty.
      ctx.drawImage(avatar, x, y, 300, 300)
      ctx.drawImage(
        image,
        0,
        Dims.Width,
        Dims.Height,
        Dims.Template
      )
      ctx.fillStyle = 'rgba(255, 100, 0, 0.35)'
      ctx.fillRect(0, 0, Dims.Width, Dims.Height)
      const bytes = ctx.getImageData(0, 0, Dims.Width, Dims.Height + Dims.Template).data
      encoder.addFrame(bytes)
    }

    encoder.finish()

    return await buffer(stream)
  }
}

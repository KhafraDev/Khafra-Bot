import { ImageUtil } from '#khaf/image/ImageUtil.js'
import { InteractionSubCommand } from '#khaf/Interaction'
import { arrayBufferToBuffer } from '#khaf/utility/util.js'
import type { ImageURLOptions } from '@discordjs/rest'
import { createCanvas, Image, type SKRSContext2D } from '@napi-rs/canvas'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import type { Buffer } from 'node:buffer'
import { request } from 'undici'

const desaturate = (ctx: SKRSContext2D, level: number, width: number, height: number): SKRSContext2D => {
  const data = ctx.getImageData(0, 0, width, height)

  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const xy = ((i * width) + j) * 4
      // https://en.wikipedia.org/wiki/Luma_(video)
      const gray = 0.299 * data.data[xy] + 0.587 * data.data[xy + 1] + 0.114 * data.data[xy + 2]

      data.data[xy] += level * (gray - data.data[xy])
      data.data[xy + 1] += level * (gray - data.data[xy + 1])
      data.data[xy + 2] += level * (gray - data.data[xy + 2])
    }
  }

  ctx.putImageData(data, 0, 0)
  return ctx
}

const contrast = (ctx: SKRSContext2D, width: number, height: number): SKRSContext2D => {
  const data = ctx.getImageData(0, 0, width, height)
  const factor = (259 / 100) + 1
  const intercept = 64 * (1 - factor)

  for (let i = 0; i < data.data.length; i += 4) {
    data.data[i] = (data.data[i] * factor) + intercept
    data.data[i + 1] = (data.data[i + 1] * factor) + intercept
    data.data[i + 2] = (data.data[i + 2] * factor) + intercept
  }

  ctx.putImageData(data, 0, 0)
  return ctx
}

const options: ImageURLOptions = { extension: 'jpeg', size: 256 }

export class kSubCommand extends InteractionSubCommand {
  constructor () {
    super({
      references: 'memes',
      name: 'deep-fry'
    })
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const option =
			interaction.options.getAttachment('image')?.proxyURL ??
			interaction.options.getUser('person')?.displayAvatarURL(options) ??
			interaction.user.displayAvatarURL(options)

    const buffer = await this.image(option)

    if (typeof buffer === 'string') {
      return { content: buffer, ephemeral: true }
    }

    return {
      files: [
        {
          attachment: buffer,
          name: 'deepfry.jpeg'
        }
      ]
    }
  }

  async image (avatarURL: string): Promise<Buffer | string> {
    if (!ImageUtil.isImage(avatarURL)) {
      return '❌ This file type is not supported.'
    }

    const { body } = await request(avatarURL)

    const image = new Image()
    image.src = arrayBufferToBuffer(await body.arrayBuffer())

    const canvas = createCanvas(image.width, image.height)
    const ctx = canvas.getContext('2d')

    ctx.drawImage(image, 0, 0)
    desaturate(ctx, -2, canvas.width, canvas.height)
    contrast(ctx, canvas.width, canvas.height)

    // pick random emojis to draw
    const emojis = ['😂','💯', '👌', '🔥'].filter(() => Math.random() < .75)
    const width = Math.round(canvas.width / 5)

    ctx.textAlign = 'center'
    ctx.font = `${width}px Apple Color Emoji`

    for (const emoji of emojis) {
      // this is the only way to rotate text :|
      ctx.save()
      ctx.translate(50, 50)
      ctx.rotate(Math.floor(Math.random() * (15 + 15 + 1) - 15) * (Math.PI / 180))
      ctx.fillText(
        emoji,
        Math.floor(Math.random() * (canvas.width - 45 + 1) - 5),
        Math.floor(Math.random() * (canvas.height - 45 + 1) - 5),
        width
      )
      ctx.restore()
    }

    return canvas.toBuffer('image/jpeg', 2)
  }
}

import { ImageUtil } from '#khaf/image/ImageUtil.js'
import { InteractionSubCommand } from '#khaf/Interaction'
import { templates } from '#khaf/utility/Constants/Path.js'
import { createCanvas, Image } from '@napi-rs/canvas'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import type { Buffer } from 'node:buffer'
import { readFileSync } from 'node:fs'
import { once } from '#khaf/utility/Memoize.js'

const lazyImage = once(() => {
  const image = new Image()
  image.src = readFileSync(templates('megamind.png'))

  return image
})

export class kSubCommand extends InteractionSubCommand {
  constructor () {
    super({
      references: 'memes',
      name: 'megamind'
    })
  }

  handle (interaction: ChatInputCommandInteraction): InteractionReplyOptions {
    const buffer = this.image(interaction)

    return {
      files: [
        {
          attachment: buffer,
          name: 'no_beaches.png'
        }
      ]
    }
  }

  image (interaction: ChatInputCommandInteraction): Buffer {
    const image = lazyImage()
    const canvas = createCanvas(image.width, image.height)
    const ctx = canvas.getContext('2d')

    ctx.drawImage(image, 0, 0)
    ctx.font = '50px Impact, Segoe UI Emoji'
    ctx.fillStyle = '#FFF'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const text = interaction.options.getString('text', true)
    const lines = ImageUtil.split(text, image.width, ctx)

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      ctx.fillText(
        lines[lineIdx],
        canvas.width / 2,
        35 + (50 * lineIdx),
        canvas.width
      )
    }

    return canvas.toBuffer('image/png')
  }
}

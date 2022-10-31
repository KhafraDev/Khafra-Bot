import { InteractionSubCommand } from '#khaf/Interaction'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { arrayBufferToBuffer } from '#khaf/utility/FetchUtils.js'
import { bold } from '@discordjs/builders'
import { getCapes, UUID } from '@khaf/minecraft'
import { createCanvas, Image } from '@napi-rs/canvas'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import type { Buffer } from 'node:buffer'
import { request } from 'undici'

// Rinse - optifine and migrator cape
// Bes - optifine cape
// Mom - minecon 2016
// LabyMod - labymod cape (surprising)
// PopoSlayer6969 - labymod cape

const dashUUID = (uuid: string): string => {
  // 3a440181e05746aead7979873f03ddbe -> 3a440181-e057-46ae-ad79-79873f03ddbe
  return `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20)}`
}

const missingCapeWarning =
	'⚠️ This account may have more capes than shown! ' +
	'Mojang only shows the active cape! ⚠️'

export class kSubCommand extends InteractionSubCommand {
  constructor () {
    super({
      references: 'minecraft',
      name: 'capes'
    })
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const username = interaction.options.getString('username', true)

    const uuid = await UUID(username)
    const capes = uuid !== null ? await getCapes(uuid.id) : []

    if (uuid === null) {
      return {
        content: '❌ Player could not be found!',
        ephemeral: true
      }
    }

    const buffer = await this.image([
      ...capes,
      `http://s.optifine.net/capes/${uuid.name}.png`,
      `https://dl.labymod.net/capes/${dashUUID(uuid.id)}`
    ])

    if (typeof buffer === 'string') {
      return { content: buffer, ephemeral: true }
    }

    return {
      embeds: [
        Embed.json({
          color: colors.ok,
          description: `
                    ${missingCapeWarning}

                    ● ${bold('Username:')} ${uuid.name}
                    ● ${bold('ID:')} ${uuid.id}`,
          image: { url: 'attachment://capes.png' }
        })
      ],
      files: [{
        attachment: buffer,
        name: 'capes.png'
      }]
    }
  }

  async image (urls: string[]): Promise<Buffer | string> {
    const buffers: { url: string, b: Buffer }[] = []

    for (const url of urls) {
      const { body, statusCode } = await request(url)

      if (statusCode !== 200) {
        if (urls.length === 1) {
          return '❌ Player has no capes, or an error occurred rendering them!'
        }

        continue // so we don't get an invalid body (ie. user doesn't have optifine cape)
      }

      buffers.push({ url, b: arrayBufferToBuffer(await body.arrayBuffer()) })
    }

    if (buffers.length === 0) {
      return '❌ Player has no capes, or an error occurred rendering them!'
    }

    const canvas = createCanvas(
      (120 * buffers.length) + (5 * (buffers.length === 1 ? 0 : buffers.length)),
      170
    ) // 12x17 w/ scale 10 (5 pixels between each cape, unless there is only 1 cape)
    const ctx = canvas.getContext('2d')

    for (const capes of buffers) {
      const { url, b } = capes

      const idx = buffers.indexOf(capes)
      const xOffset = (120 * idx) + (5 * idx)
      const cape = new Image()
      cape.src = b

      if (url.startsWith('https://dl.labymod.net/capes/')) {
        // sw (195) and sh (250) were chosen by bruteforce.
        ctx.drawImage(cape, 0, 0, 195, 250, xOffset, 0, 120, 170)
        continue
      }

      const tmpCanvas = createCanvas(12, 17)
      const tmpCtx = tmpCanvas.getContext('2d')
      tmpCtx.drawImage(cape, 0, 0)

      const data = tmpCtx.getImageData(0, 0, 12, 17)

      for (let i = 0; i < data.data.length; i += 4) {
        const x = (i / 4 % tmpCanvas.width)
        const y = (i / 4 - x) / tmpCanvas.width

        const [r, g, b, a] = data.data.slice(i, i + 4)

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`
        ctx.fillRect(x * 10 + xOffset, y * 10, 10, 10)
      }

      ctx.clearRect(xOffset, 0, 10, 10) // remove top left corner
      ctx.clearRect(xOffset + 110, 0, 10, 10) // remove top right corner
    }

    return canvas.toBuffer('image/png')
  }
}

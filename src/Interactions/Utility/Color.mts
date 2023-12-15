import { Interactions } from '#khaf/Interaction'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { bold } from '@discordjs/builders'
import { Transformer } from '@napi-rs/image'
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import { ApplicationCommandOptionType } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import type { Buffer } from 'node:buffer'

type RGB = [number, number, number]

const randomRGB = (): RGB => [
  Math.floor(Math.random() * 256),
  Math.floor(Math.random() * 256),
  Math.floor(Math.random() * 256)
]
const rgbToHex = (rgb: RGB): string => `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`
const hexToRgb = (hex: string): RGB =>
  hex.slice(1).replace(
    /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
    (_: string, r: string, g: string, b: string): string => r + r + g + g + b + b
  ).match(/.{2}/g)!.map((x) => parseInt(x, 16)) as RGB

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'color',
      description: 'Show different colors!',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'hex-color',
          description: 'Hex color (ie. #FFFFFF) to display.'
        }
      ]
    }

    super(sc)
  }

  async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const hex = interaction.options.getString('hex-color')
    const isHex = !!hex && /^#+([A-F0-9]{6}|[A-F0-9]{3})$/i.test(hex)

    const rgb = isHex ? hexToRgb(hex) : randomRGB()
    const hexColor = isHex ? hex : rgbToHex(rgb)
    const isRandom = hex === hexColor ? 'Random Color' : ''

    const buffer = await this.image(rgb)

    return {
      embeds: [
        Embed.json({
          color: colors.ok,
          description: `
            ${isRandom}
            ● ${bold('Hex Color Code:')} ${hexColor}
            ● ${bold('RGB:')} (${rgb.join(', ')})`,
          image: { url: 'attachment://color.png' }
        })
      ],
      files: [{
        attachment: buffer,
        name: 'color.png'
      }]
    }
  }

  async image ([r, g, b]: RGB): Promise<Buffer> {
    const dimension = 256
    const uint8 = new Uint8Array(dimension * dimension * 4)

    for (let i = 0; i < uint8.length; i += 4) {
      uint8[i] = r
      uint8[i + 1] = g
      uint8[i + 2] = b
      uint8[i + 3] = 255
    }

    return await Transformer
      .fromRgbaPixels(uint8, dimension, dimension)
      .png()
  }
}

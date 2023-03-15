import { capes as getCapes } from '#khaf/functions/minecraft/textures.mjs'
import { usernameToUUID } from '#khaf/functions/minecraft/username-to-uuid.mjs'
import { InteractionSubCommand } from '#khaf/Interaction'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { arrayBufferToBuffer } from '#khaf/utility/util.mjs'
import { bold } from '@discordjs/builders'
import { ResizeFilterType, ResizeFit, Transformer } from '@napi-rs/image'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import type { AssertionError } from 'node:assert'
import assert from 'node:assert'
import type { Buffer } from 'node:buffer'
import { request } from 'undici'

// Rinse - optifine and migrator cape
// Bes - optifine cape
// Mom - minecon 2016
// LabyMod - labymod cape (surprising)
// PopoSlayer6969 - labymod cape

interface Cape {
  url: string
  type: 'mojang' | 'optifine' | 'labymod'
}

const dashUUID = (uuid: string): string => {
  // 3a440181e05746aead7979873f03ddbe -> 3a440181-e057-46ae-ad79-79873f03ddbe
  return `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20)}`
}

const missingCapeWarning =
	'⚠️ This account may have more capes than shown! Mojang only shows the active cape! ⚠️'

export class kSubCommand extends InteractionSubCommand {
  constructor () {
    super({
      references: 'minecraft',
      name: 'capes'
    })
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const username = interaction.options.getString('username', true)
    let capes: string[]
    let uuid

    try {
      uuid = await usernameToUUID(username)
      capes = await getCapes(uuid.id)
    } catch (e) {
      return {
        content: (e as AssertionError).message || 'No player with that name could be found.',
        ephemeral: true
      }
    }

    const buffer = await this.image([
      ...capes.map<Cape>(cape => ({ url: cape, type: 'mojang' })),
      { url: `http://s.optifine.net/capes/${uuid.name}.png`, type: 'optifine' },
      { url: `https://dl.labymod.net/capes/${dashUUID(uuid.id)}`, type: 'labymod' }
    ])

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

  async image (capes: Cape[]): Promise<Buffer> {
    // Note: this includes capes that a user might not have (such as Optifine).
    const empty = Transformer.fromRgbaPixels(
      new Uint8Array(((44 * capes.length) + 5 * (capes.length - 1)) * 64 * 4),
      (44 * capes.length) + 5 * (capes.length - 1),
      64
    )

    for (let i = 0; i < capes.length; i++) {
      const { type, url } = capes[i]
      const { statusCode, body } = await request(url)

      if (statusCode !== 200) {
        // The player doesn't have an Optifine/Labymod/etc. cape.
        await body.dump()

        if (type === 'mojang') {
          assert(false, 'Unable to resolve cape image.')
        }

        continue
      }

      const buffer = arrayBufferToBuffer(await body.arrayBuffer())
      const transformer = new Transformer(buffer)
      let b: Buffer

      if (type === 'mojang') {
        b = await transformer
          .resize(92, 44, ResizeFilterType.Nearest, ResizeFit.Fill)
          .crop(0, 0, 17, 23)
          .png()
      } else if (type === 'optifine') {
        const { width } = await transformer.metadata()
        const args: [number, number, number, number] = width === 46
          ? [0, 0, 12, 17]
          : [2, 2, 20, 32]

        b = await transformer.crop(...args).png()
      } else if (type === 'labymod') { // eslint-disable-line @typescript-eslint/no-unnecessary-condition
        const { width, height } = await transformer.metadata()

        b = await transformer.crop(0, 0, width / 2, height).png()
      } else {
        assert(false, 'Not implemented')
      }

      const c = await new Transformer(b)
        .resize(45, 64, ResizeFilterType.Nearest, ResizeFit.Fill)
        .png()

      empty.overlay(c, 40 * i + 8 * i, 0)
    }

    return await empty.png()
  }
}

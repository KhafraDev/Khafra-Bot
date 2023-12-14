import { Interactions } from '#khaf/Interaction'
import { cwd } from '#khaf/utility/Constants/Path.mjs'
import { once } from '#khaf/utility/Memoize.mjs'
import { inlineCode } from '@discordjs/builders'
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import { ApplicationCommandOptionType } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, Client, InteractionReplyOptions, Sticker } from 'discord.js'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const mw = once(async (client: Client) => {
  const stickers = await client.fetchPremiumStickerPacks()

  return [...stickers.values()].flatMap((p) => [...p.stickers.values()])
})

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'sticker',
      description: 'Uses a default sticker!',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'name',
          description: 'The name of the sticker to use.',
          required: true
        },
        {
          type: ApplicationCommandOptionType.Integer,
          name: 'offset',
          description: 'Offset of the sticker name to use.',
          min_value: 0
        }
      ]
    }

    super(sc, { ownerOnly: true, deploy: false })
  }

  async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const stickers = await mw(interaction.client)

    const name = interaction.options.getString('name', true).toLowerCase()
    const stickerMatches: Sticker[] = []

    for (const sk of stickers) {
      if (sk.name.toLowerCase() === name) {
        stickerMatches.push(sk)
      } else if (sk.tags?.includes(name)) {
        stickerMatches.push(sk)
      }
    }

    if (stickerMatches.length === 0) {
      return {
        content: '❌ No stickers with that name were found.',
        ephemeral: true
      }
    }

    const fileNames = new Set(stickerMatches.map((n) => `${n.name};${n.id}.gif`))
    const offset = interaction.options.getInteger('offset') ?? 0
    const fileName = [...fileNames][offset - 1] ?? [...fileNames][0]
    const filePath = join(cwd, `assets/Stickers/${fileName}`)

    if (!existsSync(filePath)) {
      return {
        content: 'A sticker with that name was found, but I don\'t have it.',
        ephemeral: true
      }
    }

    return {
      files: [
        {
          attachment: await readFile(filePath),
          name: fileName,
          description: `A sticker for ${interaction.options.getString('name', true)}!`
        }
      ],
      content: `${inlineCode(interaction.options.getString('name', true))} (${fileNames.size} similar).`
    }
  }
}

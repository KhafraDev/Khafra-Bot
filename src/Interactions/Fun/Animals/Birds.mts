import { s } from '@sapphire/shapeshift'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { request } from 'undici'
import { InteractionSubCommand } from '#khaf/Interaction'

const birds: string[] = []

const schema = s.string.array

export class kSubCommand extends InteractionSubCommand {
  constructor() {
    super({
      references: 'animal',
      name: 'bird'
    })
  }

  async handle(interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    if (birds.length === 0) {
      await interaction.deferReply()

      const { body, statusCode } = await request('https://shibe.online/api/birds?count=100&urls=true&httpsUrls=true')

      if (statusCode !== 200) {
        await body.dump()

        return {
          content: "🐦 Couldn't get a picture of a random bird!",
          ephemeral: true
        }
      }

      const j: unknown = await body.json()

      if (!schema.is(j)) {
        return {
          content: `
            Whoops, an error occurred. Here's a bird in the meantime.
            https://media.discordapp.net/attachments/503024525076725775/1014723242998640741/unknown.png`,
          ephemeral: true
        }
      }

      birds.push(...j)
    }

    return {
      content: birds.shift()
    }
  }
}

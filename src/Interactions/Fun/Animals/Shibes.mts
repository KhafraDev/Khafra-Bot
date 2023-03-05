import { InteractionSubCommand } from '#khaf/Interaction'
import { s } from '@sapphire/shapeshift'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { request } from 'undici'

const shibes: string[] = []

const schema = s.string.array

export class kSubCommand extends InteractionSubCommand {
  constructor () {
    super({
      references: 'animal',
      name: 'shibe'
    })
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    if (shibes.length === 0) {
      await interaction.deferReply()

      const { body, statusCode } = await request('https://shibe.online/api/shibes?count=100&urls=true&httpsUrls=true')

      if (statusCode !== 200) {
        await body.dump()

        return {
          content: '🐶 Couldn\'t get a picture of a random shibe!',
          ephemeral: true
        }
      }

      const j: unknown = await body.json()

      if (!schema.is(j)) {
        return {
          content: `
            Whoops, an error occurred. Here's a shibe in the meantime.
            https://i.redd.it/jteq294ddwg11.jpg
            `,
          ephemeral: true
        }
      }

      shibes.push(...j)
    }

    return {
      content: shibes.shift()
    }
  }
}

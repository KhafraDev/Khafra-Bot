import { InteractionSubCommand } from '#khaf/Interaction'
import { s } from '@sapphire/shapeshift'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { request } from 'undici'

const schema = s.object({ link: s.string })

export class kSubCommand implements InteractionSubCommand {
  data = {
    references: 'animal',
    name: 'koala'
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    await interaction.deferReply()

    const { body, statusCode } = await request('https://some-random-api.ml/img/koala')

    if (statusCode !== 200) {
      await body.dump()

      return {
        content: '🐨 Couldn\'t get a picture of a random koala!',
        ephemeral: true
      }
    }

    const j: unknown = await body.json()

    if (!schema.is(j)) {
      return {
        content: '🐨 Couldn\'t get a picture of a random koala!',
        ephemeral: true
      }
    }

    return {
      content: j.link
    }
  }
}

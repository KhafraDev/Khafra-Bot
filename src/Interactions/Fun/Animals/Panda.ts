import { InteractionSubCommand } from '#khaf/Interaction'
import { s } from '@sapphire/shapeshift'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { request } from 'undici'

const schema = s.object({ link: s.string })

export class kSubCommand extends InteractionSubCommand {
  constructor () {
    super({
      references: 'animal',
      name: 'panda'
    })
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    await interaction.deferReply()

    const { body, statusCode } = await request('https://some-random-api.ml/img/panda')

    if (statusCode !== 200) {
      return {
        content: '🐼 Couldn\'t get a picture of a random panda!',
        ephemeral: true
      }
    }

    const j: unknown = await body.json()

    if (!schema.is(j)) {
      return {
        content: '🐼 Couldn\'t get a picture of a random panda!',
        ephemeral: true
      }
    }

    return {
      content: j.link
    }
  }
}

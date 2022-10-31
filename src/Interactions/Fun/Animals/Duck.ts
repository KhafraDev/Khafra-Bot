import { InteractionSubCommand } from '#khaf/Interaction'
import { s } from '@sapphire/shapeshift'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { request } from 'undici'

const schema = s.object({
  message: s.string,
  url: s.string
})

export class kSubCommand extends InteractionSubCommand {
  constructor () {
    super({
      references: 'animal',
      name: 'duck'
    })
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    await interaction.deferReply()

    const { body, statusCode } = await request('https://random-d.uk/api/v1/random')

    if (statusCode !== 200) {
      return {
        content: '🦆 Couldn\'t get a picture of a random duck!',
        ephemeral: true
      }
    }

    const j: unknown = await body.json()

    if (!schema.is(j)) {
      return {
        content: '🦆 Couldn\'t get a picture of a random duck!',
        ephemeral: true
      }
    }

    return {
      content: j.url
    }
  }
}

import { InteractionSubCommand } from '#khaf/Interaction'
import { s } from '@sapphire/shapeshift'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { request } from 'undici'

const schema = s.object({
  image: s.string,
  link: s.string
})

export class kSubCommand extends InteractionSubCommand {
  constructor () {
    super({
      references: 'animal',
      name: 'fox'
    })
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    await interaction.deferReply()

    const { body, statusCode } = await request('https://randomfox.ca/floof/')

    if (statusCode !== 200) {
      await body.dump()

      return {
        content: '🦊 Couldn\'t get a picture of a random fox!',
        ephemeral: true
      }
    }

    const j: unknown = await body.json()

    if (!schema.is(j)) {
      return {
        content: '🦊 Couldn\'t get a picture of a random fox!',
        ephemeral: true
      }
    }

    return {
      content: j.image
    }
  }
}

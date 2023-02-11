import { InteractionSubCommand } from '#khaf/Interaction'
import { s } from '@sapphire/shapeshift'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { request } from 'undici'

const schema = s.object({
  thisServed: s.number,
  totalServed: s.number,
  id: s.string,
  media: s.object({
    gif: s.string,
    poster: s.string
  }),
  source: s.string
})

export class kSubCommand extends InteractionSubCommand {
  constructor () {
    super({
      references: 'animal',
      name: 'bunny'
    })
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    await interaction.deferReply()

    const { body, statusCode } = await request('https://api.bunnies.io/v2/loop/random/?media=gif')

    if (statusCode !== 200) {
      await body.dump()

      return {
        content: '🐰 Couldn\'t get a picture of a random bunny!',
        ephemeral: true
      }
    }

    const j: unknown = await body.json()

    if (!schema.is(j)) {
      return {
        content: '🐰 Couldn\'t get a picture of a random bunny!',
        ephemeral: true
      }
    }

    return {
      content: j.media.gif
    }
  }
}

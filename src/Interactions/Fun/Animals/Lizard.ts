import { InteractionSubCommand } from '#khaf/Interaction'
import { s } from '@sapphire/shapeshift'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { request } from 'undici'

const schema = s.object({ url: s.string })

export class kSubCommand extends InteractionSubCommand {
  constructor () {
    super({
      references: 'animal',
      name: 'lizard'
    })
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    await interaction.deferReply()

    const { body, statusCode } = await request('https://nekos.life/api/v2/img/lizard')

    if (statusCode !== 200) {
      return {
        content: '🦎 Couldn\'t get a picture of a random lizard!',
        ephemeral: true
      }
    }

    const j: unknown = await body.json()

    if (!schema.is(j)) {
      return {
        content: '🦎 Couldn\'t get a picture of a random lizard!',
        ephemeral: true
      }
    }

    return {
      content: j.url
    }
  }
}

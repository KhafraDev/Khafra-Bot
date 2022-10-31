import { InteractionSubCommand } from '#khaf/Interaction'
import { s } from '@sapphire/shapeshift'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { request } from 'undici'

const schema = s.object({ file: s.string })

export class kSubCommand extends InteractionSubCommand {
  constructor () {
    super({
      references: 'animal',
      name: 'cat'
    })
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    await interaction.deferReply()

    const { body, statusCode } = await request('https://aws.random.cat/meow')

    if (statusCode !== 200) {
      return {
        content: '🐱 Couldn\'t get a picture of a random cat!',
        ephemeral: true
      }
    }

    const j: unknown = await body.json()

    if (!schema.is(j)) {
      return {
        content: '🐱 Couldn\'t get a picture of a random cat!',
        ephemeral: true
      }
    }

    return {
      content: j.file
    }
  }
}

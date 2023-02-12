import { Interactions } from '#khaf/Interaction'
import { Embed } from '#khaf/utility/Constants/Embeds.js'
import { codeBlock } from '@discordjs/builders'
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import { ApplicationCommandOptionType } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { inspect } from 'node:util'

// eslint-disable-next-line
const AsyncFunction = (async function () {}.constructor) as new (...args: unknown[]) => Function

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'eval',
      description: 'Eval some javascript - this is only available to a bot owner.',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'code',
          description: 'Code to run.',
          required: true
        }
      ]
    }

    super(sc, {
      ownerOnly: true,
      deploy: false
    })
  }

  async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const text = interaction.options.getString('code', true)

    let ret: unknown
    const fn = new AsyncFunction('interaction', text)

    try {
      ret = await fn(interaction)
    } catch (e) {
      ret = e
    }

    const inspected = inspect(ret, true, 1, false)
    const embed = Embed.ok(codeBlock('js', inspected.slice(0, 4096 - 8).trim()))

    return {
      ephemeral: true,
      embeds: [embed]
    }
  }
}

import { Interactions } from '#khaf/Interaction'
import { NASAGetRandom } from '#khaf/utility/commands/NASA'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import type { InteractionReplyOptions } from 'discord.js'

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'nasa',
      description: 'Gets a random image of space from NASA!'
    }

    super(sc, { defer: true })
  }

  async init (): Promise<InteractionReplyOptions> {
    const result = await NASAGetRandom()

    if (result === null) {
      return {
        content: '❌ No images were fetched, try again?',
        ephemeral: true
      }
    }

    const embed = Embed.json({
      color: colors.ok,
      title: result.title,
      url: result.link,
      image: { url: result.link }
    })

    if (typeof result.copyright === 'string') {
      embed.footer = { text: `© ${result.copyright}` }
    }

    return {
      embeds: [embed]
    }
  }
}

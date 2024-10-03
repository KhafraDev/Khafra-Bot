import { timezone } from '#khaf/functions/wttr/timezone.mjs'
import { Interactions } from '#khaf/Interaction'
import { ApplicationCommandOptionType, type RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'timezone',
      description: 'Gets the timezone of a location!',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'location',
          description: 'Where to get the timezone of (city, country, zip code, etc.).',
          required: true
        },
        {
          type: ApplicationCommandOptionType.Boolean,
          name: '12hour',
          description: 'Choose 12 or 24 hour time, defaults to 12 hours.'
        }
      ]
    }

    super(sc, { defer: true })
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const location = interaction.options.getString('location', true)
    const hour12 = interaction.options.getBoolean('12hour') ?? true
    const tz = await timezone(location)

    const options = {
      timeZone: tz,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12
    } satisfies Intl.DateTimeFormatOptions

    return {
      content: new Intl.DateTimeFormat([], options).format(new Date())
    }
  }
}

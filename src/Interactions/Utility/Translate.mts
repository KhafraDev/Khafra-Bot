import { Interactions } from '#khaf/Interaction'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { ApplicationCommandOptionType, type RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { translate as libreTranslate } from '#khaf/functions/translate/libretranslate.mjs'
import { translate as googleTranslate } from '#khaf/functions/translate/google.mjs'

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'translate',
      description: 'Use Google Translate to translate some text!',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'engine',
          description: 'The translating service to use.',
          required: true,
          choices: [
            { name: 'LibreTranslate', value: 'libretranslate' },
            { name: 'Google Translate', value: 'googletranslate' }
          ]
        },
        {
          type: ApplicationCommandOptionType.String,
          name: 'text',
          description: 'Text to translate.',
          required: true
        },
        {
          type: ApplicationCommandOptionType.String,
          name: 'to',
          description: 'Language code to translate to (default: "en").'
        },
        {
          type: ApplicationCommandOptionType.String,
          name: 'from',
          description: 'Language code to translate from (default: "from").'
        }
      ]
    }

    super(sc, { defer: true })
  }

  async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const to = interaction.options.getString('to')?.toLowerCase()
    const from = interaction.options.getString('from')?.toLowerCase()
    const query = interaction.options.getString('text', true)
    const engine = interaction.options.getString('engine') ?? 'googletranslate'

    const embed = Embed.json({
      color: colors.ok,
      author: {
        name: interaction.user.username,
        icon_url: interaction.user.displayAvatarURL()
      }
    })

    if (engine === 'googletranslate') {
      embed.description = await googleTranslate({ query, to, from })
    } else if (engine === 'libretranslate') {
      embed.description = await libreTranslate({ query, to, from }) ?? undefined
    }

    return {
      embeds: [embed]
    }
  }
}

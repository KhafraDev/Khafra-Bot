import { ApplicationCommandOptionType, ComponentType, InteractionResponseType } from 'discord-api-types/v10'
import type { InteractionCommand } from '../../../types'
import { fetchMDN } from '../../../lib/mdn.js'
import { colors } from '../../../lib/constants.js'

const logo = 'https://i.imgur.com/4YsLw0J.png'

export const command: InteractionCommand = {
  data: {
    name: 'mdn',
    description: 'Search on MDN!',
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: 'search',
        description: 'Term to search for.',
        required: true
      },
      {
        type: ApplicationCommandOptionType.String,
        name: 'locale',
        description: 'Use a different locale.'
      },
      {
        type: ApplicationCommandOptionType.Integer,
        name: 'limit',
        description: 'The max number of results to display.',
        max_value: 10,
        min_value: 1
      }
    ]
  },

  async run (interaction, { options }) {
    const search = options.getString('search', true)
    const locale = options.getString('locale')
    const max = options.getInteger('limit') ?? 10

    const result = await fetchMDN(search, locale ? { locale } : undefined)

    if ('errors' in result) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          embeds: [
            {
              color: colors.error,
              description: Object.values(result.errors).map(
                (err) => err.map((e) => e.message).join('\n')
              ).join('\n')
            }
          ]
        }
      }
    }

    if (result.documents.length === 0) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          embeds: [
            {
              color: colors.error,
              description: 'No results found.'
            }
          ]
        }
      }
    }

    const best = result.documents.sort((a, b) => b.score - a.score)
    const results = max >= best.length ? best : best.slice(0, max)

    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        embeds: [
          {
            color: colors.ok,
            author: {
              name: 'Mozilla Development Network',
              icon_url: logo
            },
            description: results.map(doc =>
              `[${doc.title}](https://developer.mozilla.org/${doc.locale}/docs/${doc.slug}): ${doc.summary}`
            ).join('\n'),
            footer: interaction.user ? { text: `Requested by ${interaction.user.username}` } : undefined,
            timestamp: new Date().toISOString()
          }
        ],
        components: [
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.StringSelect,
                custom_id: JSON.stringify({
                  id: interaction.user?.id ?? interaction.channel_id,
                  name: 'mdn'
                }),
                options: results.map(result => ({
                  label: result.title,
                  value: result.mdn_url
                }))
              }
            ]
          }
        ]
      }
    }
  }
}

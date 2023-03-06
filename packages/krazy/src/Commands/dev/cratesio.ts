import { type APIEmbedField, ApplicationCommandOptionType, InteractionResponseType } from 'discord-api-types/v10'
import type { InteractionCommand } from '../../types'
import { time } from '../../lib/util.js'
import { cratesio } from '../../lib/cratesio.js'
import { colors } from '../../lib/constants.js'

const logo = 'https://crates.io/assets/Cargo-Logo-Small.png'

export const command: InteractionCommand = {
  data: {
    name: 'crates',
    description: '🦀 Search for rust packages on crates.io!',
    options: [
      {
        type: ApplicationCommandOptionType.String,
        name: 'package-name',
        description: 'Crate to search for.',
        required: true
      }
    ]
  },

  async run (interaction, { options }) {
    const search = options.getString('package-name', true)
    const result = await cratesio(search)

    if ('errors' in result) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          embeds: [
            {
              color: colors.error,
              description: result.errors.map(err => err.detail).join(', ')
            }
          ]
        }
      }
    }

    const {
      description,
      downloads,
      homepage,
      id,
      repository,
      newest_version
    } = result.crate
    const version = result.versions[0]

    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        embeds: [
          {
            color: colors.ok,
            author: {
              name: `🦀 Crates.io - https://crates.io/crates/${id}`,
              icon_url: logo,
              url: `https://crates.io/crates/${id}`
            },
            description: description.slice(0, 4096),
            footer: interaction.user ? { text: `Requested by ${interaction.user.username}` } : undefined,
            timestamp: new Date().toISOString(),
            fields: [
              {
                name: 'Updated at:',
                value: time(new Date(version.created_at), 'f'),
                inline: true
              },
              {
                name: 'License:',
                value: version.license.split('/').map(
                  (license) => `[${license.toUpperCase()}](https://choosealicense.com/licenses/${license}/)`
                ).join(' or '),
                inline: true
              },
              {
                name: 'Documentation:',
                value: `[docs.rs/${id}/${newest_version}](https://docs.rs/${id}/${newest_version})`,
                inline: true
              },
              {
                name: 'Repository:',
                value: `[${repository.split('//').slice(1).join('//')}](${repository})`,
                inline: true
              },
              homepage ? {
                name: 'Homepage:',
                value: `[${homepage.split('//').slice(1).join('//')}](${homepage})`,
                inline: true
              } : undefined,
              {
                name: 'All-Time Downloads:',
                value: downloads.toLocaleString(interaction.locale),
                inline: true
              }
            ].filter(field => field !== undefined) as APIEmbedField[]
          }
        ]
      }
    }
  }
}

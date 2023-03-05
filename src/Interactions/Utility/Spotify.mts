import { spotify } from '#khaf/functions/spotify/spotify.mjs'
import { Interactions } from '#khaf/Interaction'
import { Components, disableAll } from '#khaf/utility/Constants/Components.mjs'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { minutes } from '#khaf/utility/ms.mjs'
import { ellipsis } from '#khaf/utility/String.mjs'
import { hyperlink } from '@discordjs/builders'
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import { ActivityType, ApplicationCommandOptionType } from 'discord-api-types/v10'
import {
  GuildMember,
  InteractionCollector,
  type ChatInputCommandInteraction,
  type InteractionReplyOptions,
  type StringSelectMenuInteraction
} from 'discord.js'
import assert from 'node:assert'
import { randomUUID } from 'node:crypto'

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'spotify',
      description: 'Search for a song on Spotify!',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'song',
          description: 'The song\'s name to search for.',
          required: true
        },
        {
          type: ApplicationCommandOptionType.String,
          name: 'artist',
          description: 'band or person',
          required: true
        }
      ]
    }

    super(sc, { defer: true })
  }

  async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | void> {
    let search = interaction.options.getString('song')
    const artist = interaction.options.getString('artist')

    if (!search && interaction.member instanceof GuildMember) {
      const p = interaction.member.presence?.activities.find(
        a => a.type === ActivityType.Listening && a.name === 'Spotify'
      )

      if (p) {
        search = `${p.details}${p.state ? ` - ${p.state}` : ''}`
      }
    }

    if (!search) {
      return {
        content: '❌ If you are not listening to any songs, a search query must be provided!',
        ephemeral: true
      }
    }

    const res = await spotify.search(search, artist)

    if (res.tracks.items.length === 0) {
      return {
        content: '❌ No songs found!',
        ephemeral: true
      }
    }

    // Sort tracks most -> least popular
    const tracks = res.tracks.items.sort((a, b) => b.popularity - a.popularity)
    const image = tracks[0].album.images.sort((a, b) => a.height - b.height)[0]
    const list: [string, string][] = []
    const id = randomUUID()

    for (const track of tracks) {
      const artistNames = track.artists
        .map(a => a.name)
        .join(' and ')
        .trim()

      list.push([
        ellipsis(`${track.name} by ${artistNames}`, 100),
        track.id
      ])
    }

    const description = `---\n${list.map(([label]) => label).join('\n')}\n---`

    const reply = await interaction.editReply({
      embeds: [
        Embed.json({
          color: colors.ok,
          description,
          thumbnail: {
            url: image.url
          }
        })
      ],
      components: [
        Components.actionRow([
          Components.selectMenu({
            custom_id: `spotify-${id}`,
            options: list.map(([label, id]) => ({
              label,
              value: id
            }))
          })
        ])
      ]
    })

    const collector = new InteractionCollector<StringSelectMenuInteraction>(interaction.client, {
      message: reply,
      time: minutes(5),
      filter: (i) =>
        i.isStringSelectMenu() &&
        interaction.user.id === i.user.id &&
        i.customId.endsWith(id)
    })

    for await (const [i] of collector) {
      const track = tracks.find(track => track.id === i.values[0])
      assert(track)
      const image = track.album.images.sort((a, b) => a.height - b.height)[0]

      await i.update({
        embeds: [
          Embed.json({
            color: colors.ok,
            description,
            thumbnail: {
              url: image.url
            },
            fields: [
              {
                name: 'Artists',
                value: track.artists
                  .map(track => hyperlink(track.name, track.external_urls.spotify))
                  .join('\n'),
                inline: true
              },
              {
                name: 'Link',
                value: hyperlink('Spotify', track.external_urls.spotify),
                inline: true
              },
              {
                name: 'Preview',
                value: hyperlink('Preview', track.preview_url),
                inline: true
              },
              {
                name: 'Released',
                value: new Date(track.album.release_date).toLocaleString(),
                inline: true
              },
              {
                name: 'Explicit',
                value: track.explicit ? 'Yes' : 'No',
                inline: true
              }
            ]
          })
        ]
      })
    }

    if (reply.editable) {
      await reply.edit({
        components: disableAll(reply)
      })
    }
  }
}

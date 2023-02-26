import { Interactions } from '#khaf/Interaction'
import { maxDescriptionLength } from '#khaf/utility/constants.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { hyperlink, inlineCode } from '@discordjs/builders'
import { spotify } from '#khaf/functions/spotify/spotify.js'
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import { ActivityType, ApplicationCommandOptionType } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { GuildMember } from 'discord.js'

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

  async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
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

    let desc = tracks[0].preview_url
      ? `${hyperlink('Song Preview', tracks[0].preview_url)}\n`
      : ''

    for (const track of tracks) {
      const artistNames = track.artists
        .map(a => a.name)
        .join(' and ')
        .trim()

      const line = `[${track.name}](${track.external_urls.spotify}) by ${inlineCode(artistNames)}\n`

      if (desc.length + line.length > maxDescriptionLength) break

      desc += line
    }

    const embed = Embed.json({
      color: colors.ok,
      description: desc,
      thumbnail: {
        url: image.url
      }
    })

    return {
      embeds: [embed]
    }
  }
}

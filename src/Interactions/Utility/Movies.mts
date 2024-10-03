import { Interactions } from '#khaf/Interaction'
import { searchMovie } from '#khaf/utility/commands/TMDB'
import { Buttons, Components } from '#khaf/utility/Constants/Components.mjs'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { isDM, isText } from '#khaf/utility/Discord.js'
import { formatMs } from '#khaf/utility/util.mjs'
import { bold, hyperlink, time } from '@discordjs/builders'
import type {
  APIActionRowComponent,
  APIMessageActionRowComponent,
  RESTPostAPIApplicationCommandsJSONBody
} from 'discord-api-types/v10'
import { ApplicationCommandOptionType } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'movie',
      description: 'Gets information about a movie!',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'name',
          description: 'The movie\'s name.',
          required: true
        }
      ]
    }

    super(sc, { defer: true })
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const movies = await searchMovie(
      interaction.options.getString('name', true),
      isDM(interaction.channel) || (isText(interaction.channel) && interaction.channel.nsfw)
    )

    if (!movies) {
      return {
        content: '❌ No movie with that name was found!',
        ephemeral: true
      }
    }

    const components: APIActionRowComponent<APIMessageActionRowComponent>[] = []
    const embed = Embed.json({
      color: colors.ok,
      title: movies.original_title ?? movies.title,
      description: movies.overview ?? '',
      fields: [
        {
          name: bold('Genres:'),
          value: movies.genres.map((g) => g.name).join(', '),
          inline: true
        },
        { name: bold('Runtime:'), value: formatMs(Number(movies.runtime) * 60000), inline: true },
        { name: bold('Status:'), value: movies.status, inline: true },
        {
          name: bold('Released:'),
          value: movies.release_date ? time(new Date(movies.release_date)) : 'Unknown',
          inline: true
        },
        {
          name: bold('TMDB:'),
          value: `[TMDB](https://www.themoviedb.org/movie/${movies.id})`,
          inline: true
        }
      ],
      footer: { text: 'Data provided by https://www.themoviedb.org/' }
    })

    if (movies.homepage) {
      embed.url = movies.homepage
    }

    if (movies.imdb_id) {
      const link = `https://www.imdb.com/title/${movies.imdb_id}/`
      embed.fields?.push({ name: bold('IMDB:'), value: hyperlink('IMDB', link), inline: true })

      components.push(
        Components.actionRow([
          Buttons.link('Go to IMDB', link)
        ])
      )
    }

    if (movies.poster_path) {
      embed.image = { url: `https://image.tmdb.org/t/p/original${movies.poster_path}` }
    } else if (movies.backdrop_path) {
      embed.image = { url: `https://image.tmdb.org/t/p/original${movies.backdrop_path}` }
    }

    return {
      embeds: [embed],
      components
    }
  }
}

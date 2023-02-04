import { Interactions } from '#khaf/Interaction'
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { minutes } from '#khaf/utility/ms.js'
import { s } from '@sapphire/shapeshift'
import type {
  APIEmbed
} from 'discord-api-types/v10'
import {
  ApplicationCommandOptionType, InteractionType, type RESTPostAPIApplicationCommandsJSONBody
} from 'discord-api-types/v10'
import type { ButtonInteraction } from 'discord.js'
import { InteractionCollector, type ChatInputCommandInteraction, type InteractionReplyOptions } from 'discord.js'
import { XMLParser } from 'fast-xml-parser'
import { randomUUID } from 'node:crypto'
import { URL } from 'node:url'
import { request } from 'undici'

const base = 'http://api.chartlyrics.com/'

const getLyricsURL = (artist: string, title: string): URL =>
  new URL(`/apiv1.asmx/SearchLyricDirect?artist=${artist}&song=${title}`, base)

const schema = s.object({
  GetLyricResult: s.object({
    TrackId: s.number,
    LyricChecksum: s.string,
    LyricId: s.number,
    LyricSong: s.string,
    LyricArtist: s.string,
    LyricUrl: s.string,
    LyricCovertArtUrl: s.string,
    LyricRank: s.number,
    LyricCorrectUrl: s.string,
    Lyric: s.string
  })
})

const paginateText = (text: string, max: number): string[] => {
  const pages: string[] = []

  for (let i = 0; i < text.length; i += max) {
    pages.push(text.slice(i, i + max))
  }

  return pages
}

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'lyrics',
      description: 'Get lyrics to a song! Defaults to your currently playing song.',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'artist',
          description: 'Band or singer\'s name.',
          required: true
        },
        {
          type: ApplicationCommandOptionType.String,
          name: 'song',
          description: 'The name of the song.',
          required: true
        }
      ]
    }

    super(sc, {
      defer: true
    })
  }

  async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | undefined> {
    const artist = interaction.options.getString('artist', true)
    const song = interaction.options.getString('song', true)

    const {
      body: lyricBody,
      statusCode: lyricStatus
    } = await request(getLyricsURL(artist, song))

    if (lyricStatus !== 200) {
      return {
        content: '❌ An error occurred getting these lyrics.'
      }
    }

    const lyricXML: unknown = new XMLParser().parse(await lyricBody.text())

    if (!schema.is(lyricXML)) {
      return {
        content: '❌ Invalid response received from server, sorry.'
      }
    }

    const {
      Lyric,
      LyricUrl,
      LyricCovertArtUrl,
      LyricCorrectUrl, // url to correct lyrics
      LyricArtist,
      LyricSong
    } = lyricXML.GetLyricResult

    const basicEmbed = (): APIEmbed => Embed.json({
      color: colors.ok,
      title: `${LyricArtist} - ${LyricSong}`,
      description: Lyric,
      url: LyricUrl,
      thumbnail: {
        url: LyricCovertArtUrl
      }
    })

    if (Lyric.length <= 2048) {
      return {
        embeds: [basicEmbed()],
        components: [
          Components.actionRow([
            Buttons.link('Incorrect Lyrics?', LyricCorrectUrl)
          ])
        ]
      }
    }

    let currentPage = 0
    const id = randomUUID()
    const pages = paginateText(Lyric, 2048).map((page) => {
      const embed = basicEmbed()
      embed.description = page
      return embed
    })

    const int = await interaction.editReply({
      embeds: [pages[currentPage]],
      components: [
        Components.actionRow([
          Buttons.approve('Next', `next-${id}`),
          Buttons.secondary('Previous', `back-${id}`),
          Buttons.deny('Stop', `stop-${id}`),
          Buttons.link('Incorrect Lyrics?', LyricCorrectUrl)
        ])
      ]
    })

    const collector = new InteractionCollector<ButtonInteraction>(interaction.client, {
      interactionType: InteractionType.MessageComponent,
      idle: minutes(5),
      filter: (i) =>
        i.isButton() &&
        interaction.user.id === i.user.id &&
        int.interaction?.id === i.message.interaction?.id &&
        i.customId.endsWith(id)
    })

    for await (const [collected] of collector) {
      const [action] = collected.customId.split('-')

      if (action === 'stop') break

      action === 'next' ? currentPage++ : currentPage--
      if (currentPage < 0) currentPage = pages.length - 1
      if (currentPage >= pages.length) currentPage = 0

      await collected.update({
        embeds: [pages[currentPage]],
        components: int.components
      })
    }

    const last = collector.collected.last()

    if (
      collector.collected.size !== 0 &&
      last?.replied === false
    ) {
      return void await last.update({
        components: disableAll(int)
      })
    }

    return void await interaction.editReply({
      components: disableAll(int)
    })
  }
}

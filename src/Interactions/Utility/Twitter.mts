import { URL } from 'node:url'
import { s } from '@sapphire/shapeshift'
import { ApplicationCommandOptionType, type RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { Interactions } from '#khaf/Interaction'
import { TwitterScraper } from '#khaf/functions/twitter/scraper.mjs'
import { Buttons, Components } from '#khaf/utility/Constants/Components.mjs'
import { Embed, colors } from '#khaf/utility/Constants/Embeds.mjs'

const schema = s.string
  .url({
    allowedDomains: ['twitter.com'],
    allowedProtocols: ['http:', 'https:']
  })
  .transform((value) => {
    const url = new URL(value)
    url.search = ''
    url.hash = ''
    return url
  })

export class kInteraction extends Interactions {
  #scraper = new TwitterScraper()

  constructor() {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'twitter',
      description: 'Gets a list of media embedded in a tweet!',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'tweet',
          description: 'Twitter URL to get the media of.',
          required: true
        }
      ]
    }

    super(sc, { defer: true })
  }

  async init(interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const url = interaction.options.getString('tweet', true)
    const twitterURL = schema.run(url)

    if (!twitterURL.isOk() || !twitterURL.value.pathname) {
      return {
        content: '❌ Not a Twitter status!',
        ephemeral: true
      }
    }

    const { pathname } = twitterURL.value

    // Your username can only contain letters, numbers and '_'
    // Your username must be shorter than 15 characters.
    if (!/\/[A-z0-9_]{3,15}\/status\/\d{17,19}$/.test(pathname)) {
      return {
        content: '❌ Invalid Twitter status!',
        ephemeral: true
      }
    }

    const id = /\/(\d+)$/.exec(pathname)![1]
    const api = await this.#scraper.getTweetAPILink(id)
    // biome-ignore lint/suspicious/noExplicitAny:
    const body: any = JSON.parse((await api.bodyPromise).toString('utf-8'))
    const media: string[] = []

    if (body.__typename !== 'Tweet' || !Array.isArray(body.mediaDetails)) {
      return {
        content: "Not a tweet or there's no media, sorry.",
        ephemeral: true
      }
    }

    for (const mediaItem of body.mediaDetails) {
      if (mediaItem.type === 'animated_gif' || mediaItem.type === 'video') {
        const mp4 =
          mediaItem.video_info.variants.find((v: { content_type: string }) => v.content_type === 'video/mp4') ??
          mediaItem.video_info.variants[0]

        media.push(mp4.url)
      } else {
        media.push(mediaItem.media_url_https)
      }
    }

    return {
      embeds: [
        Embed.json({
          color: colors.ok,
          description: media.join('\n')
        })
      ],
      components: [Components.actionRow([Buttons.link('Go to Twitter', twitterURL.value.toString())])]
    }
  }
}

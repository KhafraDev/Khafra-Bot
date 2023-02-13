import { Twitter } from '#khaf/functions/twitter/details.js'
import { Interactions } from '#khaf/Interaction'
import { Buttons, Components } from '#khaf/utility/Constants/Components.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { s } from '@sapphire/shapeshift'
import { ApplicationCommandOptionType, type RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { URL } from 'node:url'

const schema = s.string.url({
  allowedDomains: ['twitter.com'],
  allowedProtocols: ['http:', 'https:']
}).transform((value) => {
  const url = new URL(value)
  url.search = ''
  url.hash = ''
  return url
})

export class kInteraction extends Interactions {
  #twitter = new Twitter()

  constructor () {
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

  async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
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
    const media = await this.#twitter.getGraphTweet(id)

    if (!media) {
      return {
        content: '❌ No media found in Tweet!',
        ephemeral: true
      }
    }

    return {
      embeds: [
        Embed.json({
          color: colors.ok,
          description: media.join('\n')
        })
      ],
      components: [
        Components.actionRow([
          Buttons.link('Go to Twitter', twitterURL.value.toString())
        ])
      ]
    }
  }
}

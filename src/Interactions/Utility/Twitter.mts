import { download } from '#khaf/functions/cobalt/mediaDownloader.mjs'
import { Interactions } from '#khaf/Interaction'
import { Buttons, Components } from '#khaf/utility/Constants/Components.mjs'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { s } from '@sapphire/shapeshift'
import { ApplicationCommandOptionType, type RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { URL } from 'node:url'

const schema = s.string.url({
  allowedDomains: ['twitter.com', 'x.com', 'vxtwitter.com', 'fixvx.com'],
  allowedProtocols: ['http:', 'https:']
}).transform((value) => new URL(value))

const pathRegex = /\/[A-z0-9_]{3,15}\/status\/\d{17,19}$/

export class kInteraction extends Interactions {
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

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
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
    if (!pathRegex.test(pathname)) {
      return {
        content: '❌ Invalid Twitter status!',
        ephemeral: true
      }
    }

    try {
      const links = await download(twitterURL.value)

      return {
        embeds: [
          Embed.json({
            color: colors.ok,
            description: links
          })
        ],
        components: [
          Components.actionRow([
            Buttons.link('Go to Twitter', twitterURL.value.toString())
          ])
        ]
      }
    } catch (e: unknown) {
      return {
        content: `❌ ${(e as Error).message}`,
        ephemeral: true
      }
    }
  }
}

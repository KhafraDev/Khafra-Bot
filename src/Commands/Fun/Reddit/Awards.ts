import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import { apiSchema } from '#khaf/functions/reddit/Schema.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { inlineCode } from '@discordjs/builders'
import { s } from '@sapphire/shapeshift'
import type { APIEmbed } from 'discord-api-types/v10'
import type { Message } from 'discord.js'
import { URL } from 'node:url'
import { request } from 'undici'

const PER_COIN = 1.99 / 500
const isArray = (arr: unknown): arr is unknown[] => Array.isArray(arr)
const schema = s.string.url({
  allowedDomains: ['www.reddit.com', 'reddit.com', 'old.reddit.com'],
  allowedProtocols: ['http:', 'https:']
}).transform((value) => {
  const url = new URL(value)
  url.search = ''
  return url
})

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Calculate how much people have spent on Reddit awards for a post.',
        'https://www.reddit.com/r/pics/comments/jcjf3d/wouldbe_president_joe_biden_wrote_this_letter_to/'
      ],
      {
        name: 'award',
        folder: 'Fun',
        aliases: ['awards', 'awardprice'],
        args: [1, 1],
        ratelimit: 7
      }
    )
  }

  async init (_message: Message, { args }: Arguments): Promise<APIEmbed> {
    if (!schema.is(args[0])) {
      return Embed.error('Invalid Reddit post!')
    }

    const url = schema.parse(args[0])

    if (
    // "Names cannot have spaces, must be between 3-21 characters, and underscores are allowed."
      !/^\/r\/[A-z0-9_]{3,21}/.test(url.pathname)
    ) {
      return Embed.error('Not a valid reddit URL!')
    }

    const { body } = await request(`${url.href.replace(/.json$/, '')}.json`)
    const json: unknown = await body.json().catch(() => null)

    if (json === null || !isArray(json) || !apiSchema.is(json[0])) {
      return Embed.error('Received an invalid response.')
    } else if ('error' in json[0]) {
      return Embed.error('Error occurred.')
    }

    const post = json[0].data.children[0].data
    const coins = post.all_awardings.reduce(
      (p, c) => p + c.coin_price * c.count, 0
    )
    const price = (coins * PER_COIN).toLocaleString('en-US',
      { style: 'currency', currency: 'USD' }
    )
    const count = post.all_awardings.reduce((p, c) => p + c.count, 0)

    return Embed.json({
      color: colors.ok,
      description:
                `Post has been awarded ${inlineCode(count.toLocaleString())} times, ` +
                `estimating around ${inlineCode(price)} USD (at a rate of $1.99 per 500 coins).`,
      footer: { text: 'Free awards are counted in the cost!' }
    })
  }
}

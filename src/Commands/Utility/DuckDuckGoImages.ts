import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import { logger } from '#khaf/Logger'
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.js'
import { minutes } from '#khaf/utility/ms.js'
import { hideLinkEmbed } from '@discordjs/builders'
import { s, type InferType } from '@sapphire/shapeshift'
import { GuildNSFWLevel } from 'discord-api-types/v10'
import { InteractionCollector, type ButtonInteraction, type Message, type MessageReplyOptions } from 'discord.js'
import assert from 'node:assert'
import { randomUUID } from 'node:crypto'
import { stringify } from 'node:querystring'
import { request } from 'undici'

const errorSchema = s.object({ error: s.string, text: s.string.optional })
const imageSchema = s.object({
  vqd: s.string,
  results: s.object({
    height: s.number,
    width: s.number,
    image: s.string,
    image_token: s.string,
    source: s.string,
    thumbnail: s.string,
    thumbnail_token: s.string,
    title: s.string,
    url: s.string
  }).array
})

const base = 'https://duckduckgo.khafra.workers.dev/image/'
const SafeSearchType = {
  STRICT: 0,
  MODERATE: -1,
  OFF: -2
} as const

const getOptions = (
  images: InferType<typeof imageSchema>,
  page: number,
  id: string
): MessageReplyOptions => {
  const image = images.results[page]

  return {
    content: `${image.title} - ${hideLinkEmbed(image.url)} ${image.image}`,
    components: [
      Components.actionRow([
        Buttons.approve('Next', `next-${id}`),
        Buttons.secondary('Previous', `back-${id}`),
        Buttons.deny('Stop', `stop-${id}`)
      ])
    ]
  }
}

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Search DuckDuckGo images.'
      ],
      {
        name: 'duckduckgoimages',
        aliases: ['duckduckgoimage'],
        folder: 'Utility',
        args: [1]
      }
    )
  }

  async init (message: Message, { content }: Arguments): Promise<MessageReplyOptions | void> {
    let safeSearch: typeof SafeSearchType[keyof typeof SafeSearchType]

    if (message.guild) {
      switch (message.guild.nsfwLevel) {
        case GuildNSFWLevel.Safe:
        case GuildNSFWLevel.AgeRestricted:
          safeSearch = SafeSearchType.STRICT
          break
        case GuildNSFWLevel.Default:
          safeSearch = SafeSearchType.MODERATE
          break
        case GuildNSFWLevel.Explicit:
          safeSearch = SafeSearchType.OFF
          break
      }
    } else {
      safeSearch = SafeSearchType.MODERATE
    }

    const params = stringify({ q: content, safeSearch })
    const url = new URL(`?${params}`, base)
    const { body, statusCode } = await request(url)

    if (statusCode !== 200) {
      const json: unknown = await body.json()
      assert(errorSchema.is(json))
      logger.error(json, 'duckduckgoimage')

      return { content: 'An error occurred.' }
    }

    const images: unknown = await body.json()
    assert(imageSchema.is(images))

    let page = 0
    const id = randomUUID()
    const reply = await message.reply(getOptions(images, page, id))

    const collector = new InteractionCollector<ButtonInteraction>(message.client, {
      idle: minutes(30),
      message: reply,
      filter: (i) =>
        i.isButton() &&
        message.author.id === i.user.id &&
        i.customId.endsWith(id)
    })

    for await (const [i] of collector) {
      const [action] = i.customId.split('-')

      if (action === 'stop') {
        await i.update({
          components: disableAll(reply)
        })

        break
      }

      action === 'next' ? page++ : page--
      if (page < 0) page = images.results.length - 1
      if (page >= images.results.length) page = 0

      await i.update(getOptions(images, page, id))
    }

    if (collector.endReason === 'time' || collector.endReason === 'idle' && reply.editable) {
      await reply.edit({
        components: disableAll(reply)
      })
    }
  }
}

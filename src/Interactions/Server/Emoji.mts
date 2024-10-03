import { Interactions } from '#khaf/Interaction'
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.mjs'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { parseEmojiList } from '#khaf/utility/Emoji.mjs'
import { minutes } from '#khaf/utility/ms.mjs'
import { bold, formatEmoji, time } from '@discordjs/builders'
import {
  type APIEmbed,
  ApplicationCommandOptionType,
  InteractionType,
  type RESTPostAPIApplicationCommandsJSONBody
} from 'discord-api-types/v10'
import {
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  InteractionCollector,
  type InteractionReplyOptions,
  SnowflakeUtil
} from 'discord.js'
import { randomUUID } from 'node:crypto'
import { type EmojiEntity, parse, toCodePoints } from 'twemoji-parser'

interface GuildEmoji {
  animated: boolean
  name: string
  id: string
  index: number
}

type EmojiUnion =
  | { type: 'guild'; value: GuildEmoji }
  | { type: 'unicode'; value: EmojiEntity }

type InferPromiseResult<T> = T extends Promise<infer U> ? U : never

const makeEmojiEmbed = <T extends EmojiUnion>(
  { type, value }: T,
  cache: InferPromiseResult<ReturnType<typeof parseEmojiList>> | null
): APIEmbed => {
  if (type === 'guild') {
    const { animated, id, name } = value

    const url = `https://cdn.discordapp.com/emojis/${id}.webp`
    const createdAt = new Date(SnowflakeUtil.timestampFrom(id))

    return Embed.json({
      color: colors.ok,
      description: formatEmoji(id, animated),
      title: name,
      image: { url },
      url,
      fields: [
        { name: bold('ID:'), value: id, inline: true },
        { name: bold('Name:'), value: name, inline: true },
        { name: '\u200b', value: '\u200b', inline: true },
        { name: bold('Animated:'), value: animated ? 'Yes' : 'No', inline: true },
        { name: bold('Created:'), value: time(createdAt, 'f'), inline: true },
        { name: '\u200b', value: '\u200b', inline: true }
      ]
    })
  }

  const { text, url } = value

  const codePoints = toCodePoints(text)
  const unicodeEmoji = cache?.get(codePoints.join(' ').toUpperCase())

  if (!unicodeEmoji) {
    return Embed.json({
      color: colors.error,
      description: '❌ The text provided isn\'t an emoji or is currently unsupported!'
    })
  }

  return Embed.json({
    color: colors.ok,
    description: text,
    image: { url },
    url,
    fields: [
      { name: bold('Name:'), value: unicodeEmoji.comment, inline: true },
      { name: bold('Category:'), value: unicodeEmoji.group, inline: true },
      { name: bold('Unicode:'), value: unicodeEmoji.codePoints, inline: true }
    ]
  })
}

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'emoji',
      description: 'Get information about a Discord or unicode emoji.',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'name',
          description: 'The emoji.',
          required: true
        }
      ]
    }

    super(sc)
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<undefined | InteractionReplyOptions> {
    const emoji = interaction.options.getString('name', true)
    const parsedList: EmojiUnion[] = []

    for (const value of parse(emoji, { assetType: 'png' })) {
      parsedList.push({ type: 'unicode', value })
    }

    for (const match of emoji.matchAll(/<?(a)?:?(\w{2,32}):(\d{17,19})>?/g)) {
      const value: GuildEmoji = {
        animated: match[1] === 'a',
        name: match[2],
        id: match[3],
        index: match.index ?? 0
      }

      parsedList.push({ type: 'guild', value })
    }

    if (parsedList.length !== 0) {
      parsedList.sort((a, b) => {
        const aIndex = a.type === 'guild' ? a.value.index : a.value.indices[0]
        const bIndex = b.type === 'guild' ? b.value.index : b.value.indices[0]

        return aIndex - bIndex
      })
    } else {
      return {
        embeds: [
          Embed.json({
            color: colors.ok,
            description: 'You didn\'t include any emojis!'
          })
        ],
        ephemeral: true
      }
    }

    let page = 0
    const uuid = randomUUID()
    const cache = await parseEmojiList()
    const pages: APIEmbed[] = [
      makeEmojiEmbed(parsedList[page], cache)
    ]

    const int = await interaction.reply({
      embeds: [pages[page]],
      components: [
        Components.actionRow([
          Buttons.approve('Next', `next-${uuid}`),
          Buttons.primary('Back', `back-${uuid}`),
          Buttons.deny('Stop', `stop-${uuid}`)
        ])
      ],
      fetchReply: true
    })

    const collector = new InteractionCollector<ButtonInteraction>(interaction.client, {
      interactionType: InteractionType.MessageComponent,
      message: int,
      idle: minutes(1),
      filter: (i) =>
        interaction.user.id === i.user.id
        && int.id === i.message.id
        && i.customId.endsWith(uuid)
    })

    for await (const [i] of collector) {
      if (i.customId.startsWith('stop')) {
        collector.stop()
        await i.update({ components: disableAll(int) })
        break
      }

      i.customId.startsWith('next') ? page++ : page--
      if (page < 0) page = parsedList.length - 1
      if (page >= parsedList.length) page = 0

      if (!pages.at(page)) {
        pages.push(makeEmojiEmbed(parsedList[page], cache))
      }

      await i.update({
        embeds: [pages[page]]
      })
    }
  }
}

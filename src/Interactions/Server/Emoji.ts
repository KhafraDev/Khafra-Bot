import { Interactions } from '#khaf/Interaction'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { parseEmojiList } from '#khaf/utility/Emoji.js'
import { bold, formatEmoji, time } from '@discordjs/builders'
import {
  ApplicationCommandOptionType,
  type RESTPostAPIApplicationCommandsJSONBody
} from 'discord-api-types/v10'
import { SnowflakeUtil, type ChatInputCommandInteraction, type InteractionReplyOptions } from 'discord.js'
import { parse, toCodePoints } from 'twemoji-parser'

const guildEmojiRegex = /<?(?<animated>a)?:?(?<name>\w{2,32}):(?<id>\d{17,19})>?/

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

  async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const emoji = interaction.options.getString('name', true)

    if (guildEmojiRegex.test(emoji)) {
      const { animated, name, id } = guildEmojiRegex.exec(emoji)!.groups as {
        animated: 'a' | undefined
        name: string
        id: string
      }

      const url = `https://cdn.discordapp.com/emojis/${id}.webp`
      const createdAt = new Date(SnowflakeUtil.timestampFrom(id))
      const embed = Embed.json({
        color: colors.ok,
        // TODO(@KhafraDev): https://github.com/discordjs/discord.js/issues/8820
        description: formatEmoji(id, (animated === 'a') as false),
        title: name,
        image: { url },
        url,
        fields: [
          { name: bold('ID:'), value: id, inline: true },
          { name: bold('Name:'), value: name, inline: true },
          { name: '\u200b', value: '\u200b', inline: true },
          { name: bold('Animated:'), value: animated === 'a' ? 'Yes' : 'No', inline: true },
          { name: bold('Created:'), value: time(createdAt, 'f'), inline: true },
          { name: '\u200b', value: '\u200b', inline: true }
        ]
      })

      return {
        embeds: [embed]
      }
    }

    const twemoji = parse(emoji, { assetType: 'png' })
    const cache = await parseEmojiList()

    if (twemoji.length === 0) {
      return {
        content: '❌ No emojis were found in your message.',
        ephemeral: true
      }
    } else if (cache === null) {
      return {
        content: '❌ Emojis are being cached, please re-run this command in a minute!',
        ephemeral: true
      }
    }

    const codePoints = toCodePoints(twemoji[0].text)
    const unicodeEmoji = cache.get(codePoints.join(' ').toUpperCase())

    if (!unicodeEmoji) {
      return {
        embeds: [
          Embed.json({
            color: colors.error,
            description: '❌ This emoji is invalid or unsupported!'
          })
        ],
        ephemeral: true
      }
    }

    return {
      embeds: [
        Embed.json({
          color: colors.ok,
          description: twemoji[0].text,
          image: { url: twemoji[0].url },
          url: twemoji[0].url,
          fields: [
            { name: bold('Name:'), value: unicodeEmoji.comment, inline: true },
            { name: bold('Category:'), value: unicodeEmoji.group, inline: true },
            { name: bold('Unicode:'), value: unicodeEmoji.codePoints, inline: true }
          ]
        })
      ]
    }
  }
}

import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { parseEmojiList } from '#khaf/utility/Emoji.js'
import { bold } from '@discordjs/builders'
import type { APIEmbed } from 'discord-api-types/v10'
import type { Message } from 'discord.js'
import { parse, toCodePoints } from 'twemoji-parser'

const guildEmojiRegex = /<?(?<animated>a)?:?(?<name>\w{2,32}):(?<id>\d{17,19})>?/

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Get info about an emoji!',
        '<emoji>', 'united states'
      ],
      {
        name: 'emojiinfo',
        folder: 'Server',
        aliases: ['emojinfo', 'guildemoji'],
        args: [1],
        guildOnly: true
      }
    )
  }

  async init (_message: Message<true>, { content }: Arguments): Promise<APIEmbed> {
    if (guildEmojiRegex.test(content)) {
      const match = guildEmojiRegex.exec(content)!
      const { id, name, animated } = match.groups as Record<string, string>
      const url = `https://cdn.discordapp.com/emojis/${id}.webp`

      return Embed.json({
        color: colors.ok,
        description: match[0],
        title: name,
        image: { url },
        fields: [
          { name: bold('ID:'), value: id, inline: true },
          { name: bold('Name:'), value: name, inline: true },
          { name: bold('Animated:'), value: animated === 'a' ? 'Yes' : 'No', inline: true }
        ]
      })
    }

    const cache = await parseEmojiList()
    const unicodeEmoji = parse(content, { assetType: 'png' })

    if (unicodeEmoji.length !== 0) {
      const codePoints = toCodePoints(unicodeEmoji[0].text)
      const key = codePoints.join(' ').toUpperCase()

      if (!cache.has(key)) {
        return Embed.error('❌ This emoji is invalid or unsupported!')
      }

      const emoji = cache.get(key)!

      return Embed.json({
        color: colors.ok,
        description: unicodeEmoji[0].text,
        image: { url: unicodeEmoji[0].url },
        fields: [
          { name: bold('Name:'), value: emoji.comment, inline: true },
          { name: bold('Category:'), value: emoji.group, inline: true },
          { name: bold('Unicode:'), value: emoji.codePoints, inline: true }
        ]
      })
    }

    const name = [...cache.values()].find(n => n.comment.endsWith(content))

    if (name) {
      const unicodeEmoji = parse(name.comment, { assetType: 'png' })[0]

      return Embed.json({
        color: colors.ok,
        description: unicodeEmoji.text,
        image: { url: unicodeEmoji.url },
        fields: [
          { name: bold('Name:'), value: name.comment, inline: true },
          { name: bold('Category:'), value: name.group, inline: true },
          { name: bold('Unicode:'), value: name.codePoints, inline: true }
        ]
      })
    }

    return Embed.error('❌ No emojis were found in your message!')
  }
}

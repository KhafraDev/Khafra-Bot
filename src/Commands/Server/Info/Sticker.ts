import { Command } from '#khaf/Command'
import { colors, Embed, padEmbedFields } from '#khaf/utility/Constants/Embeds.js'
import { bold, inlineCode } from '@discordjs/builders'
import type { APIEmbed } from 'discord-api-types/v10'
import { StickerFormatType } from 'discord-api-types/v10'
import type { Message } from 'discord.js'

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Get info about a sticker!',
        '<sticker>'
      ],
      {
        name: 'sticker',
        folder: 'Server',
        aliases: ['stickers'],
        args: [0, 0],
        guildOnly: true
      }
    )
  }

  async init ({ stickers, guild }: Message<true>): Promise<APIEmbed> {
    if (stickers.size === 0)
      return Embed.error('No stickers in message! 😕')

    const sticker = stickers.first()!

    if (sticker.partial) {
      await guild.stickers.fetch(sticker.id)
    }

    const embed = Embed.json({
      color: colors.ok,
      title: `${sticker.name}${sticker.description ? ` - ${sticker.description}` : ''}`,
      fields: [
        { name: bold('Name:'), value: inlineCode(sticker.name), inline: true },
        { name: bold('ID:'), value: inlineCode(sticker.id), inline: true }
      ]
    })

    if (sticker.packId !== null) {
      embed.fields?.push({ name: bold('Pack ID:'), value: inlineCode(sticker.packId), inline: true })
    } else if (sticker.guildId !== null) {
      embed.fields?.push({
        name: bold('Guild Sticker:'),
        value: inlineCode(`Yes - ${sticker.guild}`)
      })
    }

    if (Array.isArray(sticker.tags) && sticker.tags.length > 0) {
      embed.description = `${bold('Tags:')}\n${sticker.tags.map(t => inlineCode(t)).join(', ')}`
    }

    if (sticker.format === StickerFormatType.Lottie) {
      embed.image = { url: `http://distok.top/stickers/${sticker.packId}/${sticker.id}.gif` }
    } else {
      embed.image = { url: sticker.url }
    }

    return padEmbedFields(embed)
  }
}

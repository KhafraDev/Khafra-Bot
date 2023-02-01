import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import { Embed } from '#khaf/utility/Constants/Embeds.js'
import { isText } from '#khaf/utility/Discord.js'
import { dontThrow } from '#khaf/utility/Don\'tThrow.js'
import { getMentions } from '#khaf/utility/Mentions.js'
import { hasPerms } from '#khaf/utility/Permissions.js'
import { inlineCode } from '@discordjs/builders'
import { s } from '@sapphire/shapeshift'
import type { APIEmbed } from 'discord-api-types/v10'
import { PermissionFlagsBits } from 'discord-api-types/v10'
import type { Message } from 'discord.js'

const schema = s.number.greaterThanOrEqual(1).lessThanOrEqual(100)

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Clear messages from a given channel.',
        '100', '53'
      ],
      {
        name: 'clear',
        folder: 'Moderation',
        aliases: ['bulkdelete'],
        args: [1, 1],
        guildOnly: true,
        permissions: [PermissionFlagsBits.ManageMessages]
      }
    )
  }

  async init (message: Message<true>, { args }: Arguments): Promise<undefined | APIEmbed> {
    const toDelete = Number(args[0])

    if (!schema.is(toDelete)) {
      return Embed.error(`${toDelete} is not within the range of 0-100 messages!`)
    }

    const channel = await getMentions(message, 'channels') ?? message.channel

    if (!isText(channel) || !hasPerms(channel, message.guild.members.me, [PermissionFlagsBits.ManageMessages])) {
      return Embed.perms(
        channel,
        message.guild.members.me,
        PermissionFlagsBits.ManageMessages
      )
    } else if (message.deletable) {
      await message.delete()
    }

    const [err] = await dontThrow(channel.bulkDelete(toDelete, true))

    if (err !== null) {
      return Embed.error(`An unexpected error occurred: ${inlineCode(err.message)}.`)
    }
  }
}

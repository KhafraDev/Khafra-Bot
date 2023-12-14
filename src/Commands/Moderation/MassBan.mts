import { inlineCode } from '@discordjs/builders'
import type { APIEmbed } from 'discord-api-types/v10'
import { PermissionFlagsBits } from 'discord-api-types/v10'
import type { GuildMember, Message, User } from 'discord.js'
import { type Arguments, Command } from '#khaf/Command'
import { Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { validSnowflake } from '#khaf/utility/Mentions.mjs'
import * as util from '#khaf/utility/util.mjs'

export class kCommand extends Command {
  constructor() {
    super(['Force bans a member from the guild.', '@user', '239566240987742220'], {
      name: 'fban',
      folder: 'Moderation',
      aliases: ['forcebna', 'forceban', 'massban'],
      args: [1, 10],
      guildOnly: true,
      permissions: [PermissionFlagsBits.BanMembers]
    })
  }

  async init(message: Message<true>, { args }: Arguments): Promise<APIEmbed> {
    const ids = args.map((id) => (util.isSnowflake(id) ? id : message.mentions.members.get(id.replace(/[^\d]/g, ''))))

    if (ids.some((id) => !validSnowflake(typeof id === 'string' ? id : id?.id)))
      return Embed.error('One or more ❄️❄️❄️ are invalid!')

    const reason = `Force-ban by ${message.author.id} (${message.author.tag}).`

    const promiseArr = ids
      .filter((id): id is GuildMember | string => id !== undefined)
      .map((id) => message.guild.members.ban(id, { reason }))

    const resolved = await Promise.allSettled(promiseArr)
    const good = resolved.filter(
      (p): p is PromiseFulfilledResult<string | User | GuildMember> => p.status === 'fulfilled'
    )
    const goodFormat = good.map((x) => (typeof x.value === 'string' ? inlineCode(x.value) : `${x.value}`)).join(', ')

    return Embed.ok(`
    Banned ${good.length} members (out of ${args.length} requested).
    ${goodFormat}
    `)
  }
}

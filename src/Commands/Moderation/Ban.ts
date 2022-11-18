import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { dontThrow } from '#khaf/utility/Don\'tThrow.js'
import { getMentions } from '#khaf/utility/Mentions.js'
import { parseStrToMs } from '#khaf/utility/ms.js'
import { hierarchy } from '#khaf/utility/Permissions.js'
import { inlineCode } from '@discordjs/builders'
import { s } from '@sapphire/shapeshift'
import type { APIEmbed } from 'discord-api-types/v10'
import { PermissionFlagsBits } from 'discord-api-types/v10'
import type { Message } from 'discord.js'
import { parseArgs } from 'node:util'

const schema = s.number.greaterThanOrEqual(0).lessThanOrEqual(7)

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Ban a member from the guild.',
        '@user 3d for a good reason',
        '@user 0 bye!',
        '239566240987742220 7d',
        '@user --days 7 --reason he was being toxic',
        '@user --reason goodbye sir! --days 3',
        '@user --days 2 this is the reason.'
      ],
      {
        name: 'ban',
        folder: 'Moderation',
        aliases: ['bna'],
        args: [1],
        guildOnly: true,
        permissions: [PermissionFlagsBits.BanMembers]
      }
    )
  }

  async init (message: Message<true>, { args, content }: Arguments): Promise<APIEmbed> {
    // the user might not be in the guild, but we still need to ban them
    // so we fetch their user object rather than a possibly non-existent member
    const user = await getMentions(message, 'users', content)

    const member = user && message.guild.members.resolve(user)
    if (member && !hierarchy(message.member, member)) {
      return Embed.error(`You do not have permission to ban ${member}!`)
    } else if (!user) {
      return Embed.error('No user id or user mentioned, no one was banned.')
    }

    const { values: cli } = parseArgs({
      args,
      allowPositionals: true,
      options: {
        days: {
          type: 'string'
        },
        time: {
          type: 'string'
        },
        reason: {
          type: 'string',
          short: 'r'
        },
        dry: {
          type: 'boolean'
        }
      }
    })

    // days of messages to clear
    let clear = 7, usedMs = false

    if (cli.days !== undefined || cli.time !== undefined) {
      const time = Number(cli.days ?? cli.time)

      if (schema.is(time)) {
        clear = time
      }
    } else if (typeof args[1] === 'string') {
      const ms = parseStrToMs(args[1])
      const time = Math.ceil(ms / 86_400_000) // ms -> days

      if (ms && schema.is(time)) {
        clear = time
        usedMs = true
      }
    }

    let reason = `Requested by ${message.author.tag} (${message.author.id}).`

    if (cli.reason !== undefined) {
      reason = cli.reason
    } else if (usedMs) {
      // ban @user 3d reason here -> reason here
      // ban @user reason here -> reason here
      reason = args.slice(2).join(' ')
    } else {
      const idx = args.findIndex(a => a.startsWith('--time') || a.startsWith('--days'))
      let r = ''

      if (args.slice(idx + 2).length === 0 && idx !== -1) {
        r = args.slice(1, idx).join(' ') // ban @user reason here --days 3 -> reason here
      } else {
        r = args.slice(idx + 2).join(' ') // ban @user --days 3 reason here -> reason here
      }

      if (r !== '') {
        reason = r
      }
    }

    if (cli.dry !== true) {
      const [err] = await dontThrow(message.guild.members.ban(user, {
        deleteMessageDays: clear,
        reason: reason
      }))

      if (err !== null) {
        return Embed.error(`${member ?? user} is not bannable!`)
      }
    }

    return Embed.json({
      color: colors.ok,
      description: `${member ?? user} has been banned from the guild for ${inlineCode(reason)}!`,
      footer: { text: `${clear} days of messages removed.` }
    })
  }
}

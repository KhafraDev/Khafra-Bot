import { bold } from '@discordjs/builders'
import { s } from '@sapphire/shapeshift'
import type { APIEmbed } from 'discord-api-types/v10'
import { PermissionFlagsBits } from 'discord-api-types/v10'
import type { Message } from 'discord.js'
import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import type { kGuild } from '#khaf/types/KhafraBot.js'
import { Embed, colors } from '#khaf/utility/Constants/Embeds.mjs'
import { isExplicitText, isText } from '#khaf/utility/Discord.js'
import { getMentions } from '#khaf/utility/Mentions.mjs'
import { plural } from '#khaf/utility/String.mjs'
import { parseStrToMs } from '#khaf/utility/ms.mjs'

const MAX_SECS = parseStrToMs('6h') / 1000
const schema = s.number.greaterThanOrEqual(0).lessThanOrEqual(MAX_SECS)
const perms = PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages | PermissionFlagsBits.EmbedLinks

export class kCommand extends Command {
  constructor() {
    super(['Sets ratelimit in seconds.', '#general 6h', '543940496683434014 15s', '#general 0', '5s'], {
      name: 'ratelimit',
      folder: 'Moderation',
      aliases: ['slowmode', 'slow-mode', 'rl'],
      args: [1, 2],
      guildOnly: true,
      permissions: [PermissionFlagsBits.ManageChannels]
    })
  }

  async init(message: Message<true>, { args }: Arguments, settings: kGuild): Promise<undefined | APIEmbed> {
    // if the channel is mentioned as the first argument
    const channelFirst = /(<#)?(\d{17,19})>?/g.test(args[0])
    const guildChannel = channelFirst ? (await getMentions(message, 'channels')) ?? message.channel : message.channel

    // if a channel is mentioned in the first argument,
    // seconds must be the second argument + vice versa.
    // by default, reset the ratelimit (0s).
    const secs = parseStrToMs((channelFirst ? args[1] : args[0]) || '0s') / 1000

    if (schema.run(secs).isErr()) {
      return Embed.error(`Invalid number of seconds! ${secs ? `Received ${secs} seconds.` : ''}`)
    }

    // although there are docs for NewsChannel#setRateLimitPerUser, news channels
    // do not have this function. (https://discord.js.org/#/docs/main/master/class/NewsChannel?scrollTo=setRateLimitPerUser)
    if (!isExplicitText(guildChannel)) {
      return Embed.error('Rate-limits can only be set in text channels!')
    } else if (!guildChannel.manageable) {
      return Embed.json({
        color: colors.error,
        description: `Sorry ${message.member ?? message.author}, I can't set the ratelimit in this channel.`
      })
    }

    await guildChannel.setRateLimitPerUser(secs, `Khafra-Bot, req: ${message.author.tag} (${message.author.id})`)

    await message.reply({
      embeds: [Embed.ok(`Slow-mode set in ${guildChannel} for ${secs} second${plural(secs)}!`)]
    })

    if (settings.mod_log_channel !== null) {
      const channel = message.guild.channels.cache.get(settings.mod_log_channel)
      const me = message.guild.members.me ?? (await message.guild.members.fetchMe())

      if (!isText(channel) || !channel.permissionsFor(me).has(perms)) return

      return void channel.send({
        embeds: [
          Embed.json({
            color: colors.ok,
            description: `
              ${bold('Channel:')} ${guildChannel} (${guildChannel.id}, ${guildChannel.type}).
              ${bold('Staff:')} ${message.member}
              ${bold('Duration:')} ${secs} second${plural(secs)}`,
            title: 'Channel Rate-Limited'
          })
        ]
      })
    }
  }
}

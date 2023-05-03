import type { Event } from '#khaf/Event'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import * as DiscordUtil from '#khaf/utility/Discord.js'
import { stripIndents } from '#khaf/utility/Template.mjs'
import { guildSettings } from '#khaf/utility/util.mjs'
import { bold, spoiler } from '@discordjs/builders'
import { PermissionFlagsBits } from 'discord-api-types/v10'
import { cleanContent, Events, type GuildBan } from 'discord.js'

const perms =
  PermissionFlagsBits.ViewChannel |
  PermissionFlagsBits.SendMessages |
  PermissionFlagsBits.EmbedLinks

export class kEvent implements Event {
  name = Events.GuildBanAdd as const

  async init (ban: GuildBan): Promise<void> {
    const me = await ban.guild.members.fetchMe()

    // If we can view the audit log, use the much more useful guildAuditLogEntryCreate event.
    if (me.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
      return
    }

    const item = await guildSettings(ban.guild.id, ['mod_log_channel'])

    if (!item?.mod_log_channel) {
      return
    }

    const channel = await ban.guild.channels.fetch(item.mod_log_channel)

    if (
      channel === null ||
      !DiscordUtil.isTextBased(channel) ||
      !channel.permissionsFor(me).has(perms)
    ) {
      return
    }

    if (ban.partial) {
      await ban.fetch().catch(() => {})
    }

    const cleaned = ban.reason
      ? `${bold('Reason:')} ${spoiler(cleanContent(ban.reason, channel))}`
      : ''

    await channel.send({
      embeds: [
        Embed.json({
          color: colors.ok,
          description: stripIndents`
          ${bold('User:')} ${ban.user} (${ban.user.tag} / ${ban.user.id})
          ${bold('Action:')} Ban
          ${cleaned}
          `,
          footer: {
            text: 'For more detailed logs, I need permission to view the audit log!'
          }
        })
      ]
    })
  }
}

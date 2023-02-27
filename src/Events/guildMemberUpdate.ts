import { sql } from '#khaf/database/Postgres.js'
import type { Event } from '#khaf/Event'
import type { kGuild } from '#khaf/types/KhafraBot'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { isTextBased } from '#khaf/utility/Discord.js'
import { upperCase } from '#khaf/utility/String.js'
import { stripIndents } from '#khaf/utility/Template.js'
import { bold, time } from '@discordjs/builders'
import { Events, PermissionFlagsBits, type GuildMember } from 'discord.js'

type kGuildModChannel = Pick<kGuild, 'mod_log_channel'>
type kGuildWelcomeChannel = Pick<kGuild, 'welcome_channel'>

const basic =
  PermissionFlagsBits.ViewChannel |
  PermissionFlagsBits.SendMessages |
  PermissionFlagsBits.EmbedLinks

export class kEvent implements Event {
  name = Events.GuildMemberUpdate as const

  async init (oldMember: GuildMember, newMember: GuildMember): Promise<void> {
    const { communicationDisabledUntilTimestamp: old } = oldMember
    const { communicationDisabledUntilTimestamp: current } = newMember

    if (old !== current) {
      return this.timeout(oldMember, newMember)
    }

    // https://discord.js.org/#/docs/main/master/class/RoleManager?scrollTo=premiumSubscriberRole
    const premiumRole =
      oldMember.roles.premiumSubscriberRole ??
      newMember.roles.premiumSubscriberRole ??
      (await newMember.guild.roles.fetch(undefined, { force: true })).find(
        (role) => role.tags?.premiumSubscriberRole
      )

    if (!premiumRole) {
      return
    }

    const oldHas = oldMember.roles.cache.has(premiumRole.id)
    const newHas = newMember.roles.cache.has(premiumRole.id)

    // both either have or don't have the role
    if (oldHas === newHas) {
      return
    }

    return this.booster(oldMember, newMember, oldHas && !newHas)
  }

  async timeout (oldMember: GuildMember, newMember: GuildMember): Promise<void> {
    const me = await oldMember.guild.members.fetchMe()

    // If we can view the audit log, use the much more useful guildAuditLogEntryCreate event.
    if (me.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
      return
    }

    const old = oldMember.communicationDisabledUntil
    const now = newMember.communicationDisabledUntil

    const action = (!old && now) || Date.parse(`${old}`) < Date.now() ? 'mute' : 'unmute'

    const [item] = await sql<[kGuildModChannel?]>`
      SELECT mod_log_channel FROM kbGuild
      WHERE guild_id = ${oldMember.guild.id}::text
      LIMIT 1;
    `

    if (!item?.mod_log_channel) {
      return
    }

    const channel = await oldMember.guild.channels.fetch(item.mod_log_channel)

    if (
      channel === null ||
      !isTextBased(channel) ||
      !channel.permissionsFor(me).has(basic)
    ) {
      return
    }

    await channel.send({
      embeds: [
        Embed.json({
          color: colors.ok,
          description: stripIndents`
          ${bold('User:')} ${newMember} (${newMember.user.tag} / ${newMember.user.id})
          ${bold('Action:')} ${upperCase(action)}
          ${action === 'mute' && now ? `${bold('Until:')} ${time(new Date(`${now}`), 'F')}` : ''}
          `,
          footer: {
            text: 'For more detailed logs, I need permission to view the audit log!'
          }
        })
      ]
    })
  }

  async booster (oldMember: GuildMember, newMember: GuildMember, lost: boolean): Promise<void> {
    const [item] = await sql<[kGuildWelcomeChannel?]>`
      SELECT welcome_channel FROM kbGuild
      WHERE guild_id = ${oldMember.guild.id}::text
      LIMIT 1;
    `

    if (!item?.welcome_channel) {
      return
    }

    const channel = await oldMember.guild.channels.fetch(item.welcome_channel)
    const me = oldMember.guild.members.me

    if (
      channel === null ||
      me === null ||
      !isTextBased(channel) ||
      !channel.permissionsFor(me).has(basic)
    ) {
      return
    }

    if (lost) {
      const embed = Embed.json({
        color: colors.error,
        description: `${newMember} is no longer boosting the server! 😨`,
        author: {
          name: newMember.user.username,
          icon_url: newMember.user.displayAvatarURL()
        }
      })

      await channel.send({ embeds: [embed] })
    } else { // gained role
      const embed = Embed.json({
        color: colors.boost,
        description: `${newMember} just boosted the server! 🥳`,
        author: {
          name: newMember.user.username,
          icon_url: newMember.user.displayAvatarURL()
        }
      })

      await channel.send({ embeds: [embed] })
    }
  }
}

import { sql } from '#khaf/database/Postgres.js'
import { Event } from '#khaf/Event'
import type { kGuild } from '#khaf/types/KhafraBot.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { isTextBased } from '#khaf/utility/Discord.js'
import { PermissionFlagsBits } from 'discord-api-types/v10'
import { Events, type GuildMember } from 'discord.js'

type kGuildWelcomeChannel = Pick<kGuild, 'welcome_channel'>

const basic =
  PermissionFlagsBits.ViewChannel |
  PermissionFlagsBits.SendMessages |
  PermissionFlagsBits.EmbedLinks

export class kEvent extends Event<typeof Events.GuildMemberUpdate> {
  name = Events.GuildMemberUpdate as const

  async init (oldMember: GuildMember, newMember: GuildMember): Promise<void> {
    // https://discord.js.org/#/docs/main/master/class/RoleManager?scrollTo=premiumSubscriberRole
    const premiumRole = oldMember.roles.premiumSubscriberRole
    if (!premiumRole) return

    const oldHas = oldMember.roles.cache.has(premiumRole.id)
    const newHas = newMember.roles.cache.has(premiumRole.id)

    // both either have or don't have the role
    if (oldHas === newHas) {
      return
    }

    const [item] = await sql<[kGuildWelcomeChannel?]>`
      SELECT welcome_channel
      FROM kbGuild
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

    if (oldHas && !newHas) { // lost role
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

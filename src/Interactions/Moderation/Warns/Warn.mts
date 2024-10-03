import { sql } from '#khaf/database/Postgres.mjs'
import { InteractionSubCommand } from '#khaf/Interaction'
import type { Warning } from '#khaf/types/KhafraBot.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { hierarchy } from '#khaf/utility/Permissions.mjs'
import { plural } from '#khaf/utility/String.mjs'
import * as util from '#khaf/utility/util.mjs'
import { bold, inlineCode } from '@discordjs/builders'
import { PermissionFlagsBits } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { GuildMember } from 'discord.js'

interface WarnInsert {
  insertedid: Warning['id']
  insertedpoints: Warning['k_points']
  k_ts: Warning['k_ts']
}

export class kSubCommand implements InteractionSubCommand {
  data = {
    references: 'warns',
    name: 'warn'
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | undefined> {
    if (!interaction.inCachedGuild()) {
      return {
        content: '❌ The bot must be re-invited with all permissions to use this command.',
        ephemeral: true
      }
    }

    const points = interaction.options.getInteger('points', true)
    const reason = interaction.options.getString('reason') ?? undefined
    const member = interaction.options.getMember('member')
      ?? interaction.options.getUser('member', true)

    if (member instanceof GuildMember) {
      if (
        member.permissions.has(PermissionFlagsBits.KickMembers)
        || member.permissions.has(PermissionFlagsBits.Administrator)
      ) {
        return {
          content: '❌ This member cannot be warned!',
          ephemeral: true
        }
      } else if (!hierarchy(interaction.member, member)) {
        return {
          content: `❌ You can't warn ${member}!`,
          ephemeral: true
        }
      } else if (interaction.guild.members.me && !hierarchy(interaction.guild.members.me, member)) {
        return {
          content: `❌ I can't warn ${member}! 😦`,
          ephemeral: true
        }
      }
    }

    const rows = await sql<WarnInsert[]>`
      WITH warns AS (
          SELECT id, k_points, k_ts
          FROM kbWarns
          WHERE
              kbWarns.k_guild_id = ${interaction.guildId}::text AND
              kbWarns.k_user_id = ${member.id}::text
      ), inserted AS (
          INSERT INTO kbWarns (
              k_guild_id, 
              k_user_id, 
              k_points
          ) VALUES (
              ${interaction.guildId}::text, 
              ${member.id}::text, 
              ${points}::smallint
          ) RETURNING k_points, id, k_ts
      )

      SELECT k_ts, inserted.id AS insertedId, inserted.k_points AS insertedPoints FROM inserted

      UNION ALL

      SELECT k_ts, warns.id AS warnsId, warns.k_points as warnPoints FROM warns
      ORDER BY k_ts DESC;
    `

    // something really bad has gone wrong...
    if (rows.length === 0) {
      return {
        content: '❌ Yeah, I\'m not really sure what happened. 🤯',
        ephemeral: true
      }
    }

    const totalPoints = rows.reduce((a, b) => a + b.insertedpoints, 0)
    const k_id = rows[0].insertedid

    const settings = await util.guildSettings(interaction.guildId, ['max_warning_points'])

    if (settings && settings.max_warning_points <= totalPoints) {
      let kicked: boolean

      if (member instanceof GuildMember) {
        if (!member.kickable) {
          return {
            content: '✅ Member was warned but I don\'t have permission to kick them.'
          }
        }

        kicked = await member.kick(reason).then(() => true, () => false)
      } else {
        kicked = await interaction.guild.members.kick(member)
          .then(() => true, () => false)
      }

      if (!kicked) {
        return {
          content: `✅ Member was warned (${inlineCode(k_id)}) but an error prevented me from kicking them.`,
          ephemeral: true
        }
      }

      await interaction.editReply({
        content: `${member} was automatically kicked from the server for having `
          + `${totalPoints.toLocaleString()} warning point${plural(totalPoints)} (#${inlineCode(k_id)}).`
      })
    } else {
      await interaction.editReply({
        content: `Gave ${member} ${points.toLocaleString()} warning point${plural(points)} (${inlineCode(k_id)}).`
          + ` Member has ${totalPoints.toLocaleString()} points total.`
      })
    }

    const kicked = settings && settings.max_warning_points <= totalPoints ? 'Yes' : 'No'
    const embed = Embed.json({
      color: colors.ok,
      description: `
        ${bold('Offender:')} ${member}
        ${bold('Reason:')} ${inlineCode(reason && reason.length > 0 ? reason.slice(0, 100) : 'No reason given.')}
        ${bold('Staff:')} ${interaction.member}
        ${bold('Points:')} ${points} warning point${plural(points)} given.
        ${bold('Kicked:')} ${kicked} (${totalPoints.toLocaleString()} total point${plural(totalPoints)}).
        ${bold('ID:')} ${inlineCode(k_id)}`,
      title: 'Member Warned'
    })

    return util.postToModLog(interaction, [embed])
  }
}

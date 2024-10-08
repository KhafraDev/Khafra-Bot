import { sql } from '#khaf/database/Postgres.mjs'
import { InteractionSubCommand } from '#khaf/Interaction'
import type { Warning } from '#khaf/types/KhafraBot.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { plural } from '#khaf/utility/String.mjs'
import * as util from '#khaf/utility/util.mjs'
import { bold, inlineCode } from '@discordjs/builders'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'

interface WarningDel {
  id: Warning['id']
  k_points: Warning['k_points']
  k_user_id: Warning['k_user_id']
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

export class kSubCommand implements InteractionSubCommand {
  data = {
    references: 'warns',
    name: 'remove'
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | undefined> {
    if (!interaction.inGuild()) {
      return {
        content: '❌ The bot must be re-invited with all permissions to use this command.',
        ephemeral: true
      }
    }

    const uuid = interaction.options.getString('id', true)

    if (!uuidRegex.test(uuid)) {
      return {
        content: '❌ That ID is not formatted correctly, please use a valid ID next time!',
        ephemeral: true
      }
    }

    const deleted = await sql<WarningDel[]>`
      DELETE FROM kbWarns
      WHERE 
          kbWarns.id = ${uuid}::uuid AND
          kbWarns.k_guild_id = ${interaction.guildId}::text
      RETURNING id, k_points, k_user_id;
    `

    if (deleted.length === 0) {
      return {
        content: '❌ No warning with that ID could be found in the guild!',
        ephemeral: true
      }
    }

    await interaction.editReply({
      content: `Warning ${inlineCode(deleted[0].id)} has been removed!`
    })

    const embed = Embed.json({
      color: colors.ok,
      description: `
        ${bold('Removed From:')} ${deleted[0].k_user_id}
        ${bold('Staff:')} ${interaction.user}
        ${bold('Points:')} ${deleted[0].k_points} warning point${plural(deleted[0].k_points)} removed.
        ${bold('ID:')} ${inlineCode(uuid)}`,
      title: 'Warning Removed'
    })

    return util.postToModLog(interaction, [embed])
  }
}

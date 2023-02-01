import { sql } from '#khaf/database/Postgres.js'
import { InteractionSubCommand } from '#khaf/Interaction'
import { type Giveaway } from '#khaf/types/KhafraBot.js'
import { Buttons, Components } from '#khaf/utility/Constants/Components.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { parseStrToMs, seconds, weeks } from '#khaf/utility/ms.js'
import { logError } from '#khaf/utility/Rejections.js'
import { plural } from '#khaf/utility/String.js'
import { stripIndents } from '#khaf/utility/Template.js'
import { bold, inlineCode, time } from '@discordjs/builders'
import { s } from '@sapphire/shapeshift'
import { PermissionFlagsBits } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions, NewsChannel, TextChannel } from 'discord.js'

type GiveawayId = Pick<Giveaway, 'id'>

const schema = s.number.greaterThanOrEqual(seconds(60)).lessThanOrEqual(weeks(52))

const perms =
  PermissionFlagsBits.SendMessages |
  PermissionFlagsBits.ViewChannel |
  PermissionFlagsBits.EmbedLinks

export class kSubCommand extends InteractionSubCommand {
  constructor () {
    super({
      references: 'giveaway',
      name: 'create'
    })
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const channel = interaction.options.getChannel('channel', true) as TextChannel | NewsChannel
    const prize = interaction.options.getString('prize', true)
    const ends = parseStrToMs(interaction.options.getString('ends', true))
    const winners = interaction.options.getInteger('winners') ?? 1

    if (!schema.is(ends)) {
      return {
        content: '❌ A giveaway must last longer than a minute, and less than a month!',
        ephemeral: true
      }
    } else if (!interaction.memberPermissions?.has(perms)) {
      return {
        content: '❌ You do not have permission to use this command!',
        ephemeral: true
      }
    } else if (
      interaction.guild === null ||
      interaction.guild.members.me === null ||
      !channel.permissionsFor(interaction.guild.members.me).has(perms)
    ) {
      return {
        content: '❌ I do not have full permissions in this guild, please re-invite with permission to manage channels.',
        ephemeral: true
      }
    }

    const endsDate = new Date(Date.now() + ends)
    const embed = Embed.json({
      color: colors.ok,
      title: 'A giveaway is starting!',
      description: `
      ${prize.slice(0, 1950)}

      ${bold('React with 🎉 to enter!')}`,
      timestamp: endsDate.toISOString(),
      footer: { text: `${winners} winner${plural(winners)}` }
    })

    const sent = await channel.send({
      embeds: [embed]
    })

    await sent.react('🎉').catch(logError)

    const rows = await sql<GiveawayId[]>`
      INSERT INTO kbGiveaways (
          guildId, 
          messageId,
          channelId,
          initiator,
          endDate,
          prize,
          winners
      ) VALUES (
          ${interaction.guildId}::text, 
          ${sent.id}::text, 
          ${channel.id}::text,
          ${interaction.user.id}::text,
          ${endsDate}::timestamp,
          ${prize},
          ${winners}::smallint
      ) ON CONFLICT DO NOTHING
      RETURNING id;
    `

    return {
      content: stripIndents`
        ✅ Started a giveaway in ${channel}!

        • ${winners} winner${plural(winners)}
        • Ends ${time(endsDate)}
        • ID ${inlineCode(rows[0].id)}`,
      components: [
        Components.actionRow([
          Buttons.link('Message Link', sent.url)
        ])
      ]
    }
  }
}

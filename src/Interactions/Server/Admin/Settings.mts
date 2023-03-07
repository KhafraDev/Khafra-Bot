import { sql } from '#khaf/database/Postgres.mjs'
import { Interactions } from '#khaf/Interaction'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { isText } from '#khaf/utility/Discord.js'
import { bitfieldToString } from '#khaf/utility/Permissions.mjs'
import { stripIndents } from '#khaf/utility/Template.mjs'
import { guildSettings } from '#khaf/utility/util.mjs'
import { bold, inlineCode } from '@discordjs/builders'
import {
  ApplicationCommandOptionType,
  ChannelType,
  PermissionFlagsBits,
  type RESTPostAPIApplicationCommandsJSONBody
} from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import assert from 'node:assert'

const ifNot = (label: string): (value: unknown) => string =>
  (value: unknown): string => inlineCode(`${value ?? label}`)

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'settings',
      description: 'Manage the bot\'s settings in your guild!',
      default_member_permissions: bitfieldToString([PermissionFlagsBits.Administrator]),
      dm_permission: false,
      options: [
        {
          type: ApplicationCommandOptionType.Integer,
          name: 'max-warning-points',
          description: 'The maximum warning points a member can receive before being kicked.',
          min_value: 0,
          max_value: 2 ** 15 - 1
        },
        {
          type: ApplicationCommandOptionType.Channel,
          name: 'mod-logs-channel',
          description: 'The channel where moderation logs are sent.',
          channel_types: [
            ChannelType.GuildAnnouncement,
            ChannelType.GuildText
          ]
        },
        {
          type: ApplicationCommandOptionType.Channel,
          name: 'welcome-channel',
          description: 'The channel where member join and leave messages are posted.',
          channel_types: [
            ChannelType.GuildAnnouncement,
            ChannelType.GuildText
          ]
        },
        {
          type: ApplicationCommandOptionType.Channel,
          name: 'staff-channel',
          description: 'Channel for general staff messages to be posted.',
          channel_types: [
            ChannelType.GuildAnnouncement,
            ChannelType.GuildText
          ]
        }
        // TODO: once tickets are added as interactions, add an option to change
        // ticket channel.
      ]
    }

    super(sc)
  }

  async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    if (interaction.guild === null || interaction.guildId === null) {
      return {
        content: '❌ The bot is not in the guild, re-invite with the proper perms to change these settings!',
        ephemeral: true
      }
    }

    // The type needs to be downcasted on purpose. Expanding the
    // type causes the postgres types to error.
    const settings: Record<string, unknown> = {
      'max_warning_points': interaction.options.getInteger('max-warning-points'),
      'mod_log_channel': interaction.options.getChannel('mod-logs-channel'),
      'welcome_channel': interaction.options.getChannel('welcome-channel'),
      'staffChannel': interaction.options.getChannel('staff-channel')
    }

    const keys = Object.keys(settings).filter(k => settings[k] != null)

    if (keys.length === 0) {
      const guild = await guildSettings(interaction.guildId)
      assert(guild)

      const unset = ifNot('N/A (unset)')

      return {
        embeds: [
          Embed.json({
            color: colors.ok,
            title: `✅ ${interaction.guild.name} Settings`,
            description: `
              ${bold('Warning Points Limit:')} ${unset(guild.max_warning_points)}
              ${bold('Mod Logs:')} ${unset(guild.mod_log_channel)}
              ${bold('Welcome Channel:')} ${unset(guild.welcome_channel)}
              ${bold('Ticket Channel:')} ${unset(guild.ticketchannel)}
              ${bold('Staff Channel:')} ${unset(guild.staffChannel)}
              `
          })
        ]
      }
    }

    const me = await interaction.guild.members.fetchMe()
    const changed = new Map<string, string | number>()
    const warnings: string[] = []

    for (const key of keys) {
      const value = settings[key]

      if (typeof value === 'number') {
        changed.set(key, value)
        continue
      }

      assert(isText(value))

      if (!value.permissionsFor(me).has(PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages)) {
        warnings.push(`I don't have permission to view or send messages in ${value}.`)
        continue
      }

      changed.set(key, value.id)
    }

    if (changed.size) {
      // https://github.com/porsager/postgres#dynamic-columns-in-updates
      await sql`
        UPDATE kbGuild SET
        ${sql(Object.fromEntries(changed), ...keys)}
        WHERE guild_id = ${interaction.guildId}::text;
      `

      const text = keys
        .map(k => `- ${inlineCode(k.replace(/_/g, ' '))}: ${settings[k]}`)
        .join('\n')

      return {
        embeds: [
          Embed.json({
            color: colors.ok,
            title: '✅ Updated settings!',
            description: stripIndents`
            ${text}

            ${warnings.join('\n')}
            `
          })
        ]
      }
    }

    return {
      embeds: [
        Embed.json({
          color: colors.ok,
          title: 'No settings updated',
          description: stripIndents`
          No settings needed to be updated. 🤷

          ${warnings.join('\n')}
          `
        })
      ]
    }
  }
}

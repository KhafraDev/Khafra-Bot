import { Interactions } from '#khaf/Interaction'
import { Buttons, Components } from '#khaf/utility/Constants/Components.mjs'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { cwd } from '#khaf/utility/Constants/Path.mjs'
import { createFileWatcher } from '#khaf/utility/FileWatcher.mjs'
import { Stats } from '#khaf/utility/Stats.mjs'
import { formatMs } from '#khaf/utility/util.mjs'
import { bold, inlineCode } from '@discordjs/builders'
import {
  ApplicationCommandOptionType,
  OAuth2Scopes,
  PermissionFlagsBits,
  type RESTPostAPIApplicationCommandsJSONBody
} from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { version as DJSVersion } from 'discord.js'
import { join } from 'node:path'
import { memoryUsage, version } from 'node:process'

const pkg = createFileWatcher<typeof import('../../../package.json')>(join(cwd, 'package.json'))

const scopes = [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands]
const invitePermissions = [
  PermissionFlagsBits.AddReactions,
  PermissionFlagsBits.AttachFiles,
  PermissionFlagsBits.BanMembers,
  PermissionFlagsBits.CreateInstantInvite,
  PermissionFlagsBits.EmbedLinks,
  PermissionFlagsBits.KickMembers,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.ManageEmojisAndStickers,
  PermissionFlagsBits.ManageGuild,
  PermissionFlagsBits.ManageMessages,
  PermissionFlagsBits.ManageRoles,
  PermissionFlagsBits.ModerateMembers,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.SendMessages
]

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'bot',
      description: 'Bot commands',
      options: [
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'info',
          description: 'Basic development information about the bot.'
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'ping',
          description: 'See the bot\'s ping. Who\'s lagging?'
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'stats',
          description: 'View statistics related to the bot.'
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'github',
          description: 'View my source code!'
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'invite',
          description: 'Get my invite link.'
        }
      ]
    }

    super(sc)
  }

  async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const was = Date.now()
    const subcommand = interaction.options.getSubcommand(true)

    if (subcommand === 'info') {
      const memoryMB = memoryUsage().heapUsed / 2 ** 20 // same as 1024 * 1024
      const uptime = formatMs(interaction.client.uptime)

      const embed = Embed.json({
        color: colors.ok,
        description: `
          ${bold('Dependencies')}
          ${Object.keys(pkg.dependencies).map(k => `[${k}](https://npmjs.com/package/${k})`).join(', ')}`,
        fields: [
          { name: bold('Memory:'), value: `${memoryMB.toFixed(2)} MB` },
          { name: bold('Khafra-Bot:'), value: `v${pkg.version}`, inline: true },
          { name: bold('Discord.js:'), value: `v${DJSVersion}`, inline: true },
          { name: bold('Node.JS:'), value: version, inline: true },
          { name: bold('Uptime:'), value: `⏰ ${inlineCode(uptime)}` }
        ]
      })

      return {
        embeds: [embed]
      }
    } else if (subcommand === 'ping') {
      await interaction.reply({
        embeds: [Embed.ok('Pinging...!')],
        ephemeral: true
      })

      const now = Date.now()
      const embed = Embed.ok(`
      Pong! 🏓

      Bot: ${(now - was).toFixed(2)} ms
      Heartbeat: ${interaction.client.ws.ping} ms
      `)

      await interaction.followUp({
        embeds: [embed],
        ephemeral: true
      })
    } else if (subcommand === 'stats') {
      const guilds = interaction.client.guilds.cache
      const {
        globalCommandsUsed,
        globalMessages
      } = Stats.stats

      const totalMembers = guilds.map(g => g.memberCount)
        .reduce((a, b) => a + b, 0)
        .toLocaleString()
      const totalGuilds = guilds.size.toLocaleString()

      const embed = Embed.json({
        color: colors.ok,
        title: 'Bot Statistics',
        fields: [
          { name: bold('Guilds:'), value: totalGuilds, inline: true },
          { name: bold('Members:'), value: totalMembers, inline: true },
          { name: '\u200b', value: '\u200b', inline: true },
          { name: bold('Total Messages:'), value: globalMessages.toLocaleString(), inline: true },
          { name: bold('Total Commands:'), value: globalCommandsUsed.toLocaleString(), inline: true },
          { name: '\u200b', value: '\u200b', inline: true }
        ]
      })

      return {
        embeds: [embed]
      }
    } else if (subcommand === 'github') {
      return {
        content: 'https://github.com/KhafraDev/Khafra-Bot',
        components: [
          Components.actionRow([
            Buttons.link('GitHub', 'https://github.com/KhafraDev/Khafra-Bot')
          ])
        ]
      }
    } else if (subcommand === 'invite') {
      const everything = interaction.client.generateInvite({ scopes, permissions: invitePermissions })
      const slashCommands = interaction.client.generateInvite({ scopes, permissions: 0n })

      return {
        embeds: [
          Embed.json({
            color: colors.ok,
            fields: [
              { name: bold('Everything:'), value: everything },
              { name: bold('Enable slash commands and buttons only:'), value: slashCommands }
            ]
          })
        ]
      }
    }

    return {
      content: 'Unknown option.',
      ephemeral: true
    }
  }
}

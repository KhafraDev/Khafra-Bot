import { sql } from '#khaf/database/Postgres.js'
import type { Report } from '#khaf/functions/case/reports.js'
import { Interactions } from '#khaf/Interaction'
import { Buttons, Components } from '#khaf/utility/Constants/Components.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { isGuildTextBased } from '#khaf/utility/Discord.js'
import { validSnowflake } from '#khaf/utility/Mentions.js'
import { stripIndents } from '#khaf/utility/Template.js'
import { createDeferredPromise, interactionGetGuildSettings } from '#khaf/utility/util.js'
import { bold, hyperlink } from '@discordjs/builders'
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import { ApplicationCommandOptionType, InteractionType } from 'discord-api-types/v10'
import {
  InteractionCollector,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type GuildBasedChannel,
  type InteractionReplyOptions,
  type Message
} from 'discord.js'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'report',
      description: 'report a message or user to the server\'s moderators',
      dm_permission: false,
      options: [
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'user',
          description: 'Reports a user to the server\'s moderators.',
          options: [
            {
              type: ApplicationCommandOptionType.User,
              name: 'user',
              description: 'the user to report',
              required: true
            },
            {
              type: ApplicationCommandOptionType.String,
              name: 'reason',
              description: 'the reason you are reporting this user',
              required: true,
              max_length: 2048,
              min_length: 10
            },
            {
              type: ApplicationCommandOptionType.Attachment,
              name: 'attachment',
              description: 'add an attachment to this report (image only)'
            }
          ]
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'message',
          description: 'Reports a message to the server\'s moderators.',
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: 'message',
              description: 'the link to the message (right click -> "Copy Message Link")',
              required: true
            },
            {
              type: ApplicationCommandOptionType.String,
              name: 'reason',
              description: 'the reason you are reporting this message',
              required: true,
              max_length: 2048,
              min_length: 10
            }
          ]
        }
      ]
    }

    super(sc)
  }

  async init (interaction: ChatInputCommandInteraction): Promise<void | InteractionReplyOptions> {
    if (!interaction.inGuild()) {
      return {
        content: 'Cannot use the command here.',
        ephemeral: true
      }
    }

    await interaction.deferReply({ ephemeral: true })

    const settings = await interactionGetGuildSettings(interaction)

    if (!settings?.staffChannel) {
      return {
        content: 'A staff channel is not setup in this guild. Ask an administrator to add one!',
        ephemeral: true
      }
    }

    const subcommand = interaction.options.getSubcommand(true)
    const reason = interaction.options.getString('reason', true)
    const user = subcommand === 'user' ? interaction.options.getUser('user', true) : null
    const messageLink = !user ? interaction.options.getString('message', true) : null

    const id = randomUUID()
    const display = subcommand === 'user'
      ? `${user} - ${user!.tag} (${user!.id})`
      : `this ${hyperlink('message', messageLink!)}`

    const confirm = await interaction.editReply({
      content: stripIndents`
      Are you sure you want to report ${display}?
      ${bold('Reason')}: ${reason}

      ${subcommand === 'user' ? 'ℹ️ You should supply an attachment as context!\n' : ''}
      Creating false reports may lead to being punished by the server staff.
      `,
      components: [
        Components.actionRow([
          Buttons.deny('Cancel report', `cancel-${id}`),
          Buttons.approve('Create report', `create-${id}`),
          Buttons.link('Report to Discord', 'https://dis.gd/request')
        ])
      ]
    })

    const p = createDeferredPromise()

    const collector = new InteractionCollector<ButtonInteraction>(interaction.client, {
      interactionType: InteractionType.MessageComponent,
      time: 120_000,
      max: 1,
      message: confirm,
      filter: (i) =>
        i.isButton() &&
        interaction.user.id === i.user.id &&
        i.customId.endsWith(id)
    })

    collector.once('collect', (i) => p.resolve(i.customId.startsWith('create-')))
    collector.once('end', () => p.resolve(false))

    if (!await p.promise) {
      await collector.collected.first()?.update({
        content: 'No response received, the report was cancelled.',
        embeds: [
          Embed.json({
            author: {
              name: user ? `${user.tag} (${user.id})` : 'Message',
              icon_url: user?.displayAvatarURL() ?? interaction.user.displayAvatarURL()
            },
            description: messageLink ?? undefined
          })
        ]
      })

      return void await interaction.editReply({
        content: 'Cancelled the report.',
        components: []
      })
    } else {
      await collector.collected.first()?.update({
        content: 'Creating the report. Please wait for a staff member to resolve it.',
        components: []
      })
    }

    let sqlId: number
    const attachments: string[] = []

    if (subcommand === 'message') {
      let message: Message<true>

      try {
        const url = new URL(messageLink!)
        const { host, pathname } = url
        const [empty, channels, ...rest] = pathname.split('/', 5)

        if (host !== 'discord.com' && !host.endsWith('.discord.com')) {
          return {
            content:
              '❌ This link is not from Discord. Right click on a message and select ' +
              '"Copy Message Link" to get the link!',
            ephemeral: true
          }
        } else if (
          empty !== '' ||
          channels !== 'channels' ||
          rest.some((part) => !validSnowflake(part))
        ) {
          return {
            content:
              '❌ This link doesn\'t lead to a message. Right click on a message and select ' +
              '"Copy Message Link" to get the link!',
            ephemeral: true
          }
        }

        message = await this.getMessage(interaction, rest)
      } catch {
        return {
          content: '❌ This message link is invalid.',
          ephemeral: true
        }
      }

      attachments.push(...[...message.attachments.values()].map(a => a.url))

      const report = {
        targetAttachments: attachments,
        guildId: interaction.guildId,
        messageChannelId: message.channelId,
        reason,
        targetId: message.author.id,
        messageId: message.id,
        reporterId: interaction.user.id,
        status: 'unresolved'
      } satisfies Omit<Report, 'id'>

      const [{ id }] = await sql<Pick<Report, 'id'>[]>`
        INSERT INTO "kbReport"
        ${sql(report as Record<string, unknown>, ...Object.keys(report))}
        RETURNING "kbReport".id
      `

      sqlId = id
    } else {
      const attachment = interaction.options.getAttachment('attachment')?.url

      if (attachment) {
        attachments.push(attachment)
      }

      const report = {
        reason,
        targetId: user!.id,
        reporterId: interaction.user.id,
        contextAttachments: attachment,
        guildId: interaction.guildId,
        status: 'unresolved'
      } satisfies Omit<Report, 'id'>

      const [{ id }] = await sql<{ id: number }[]>`
        INSERT INTO "kbReport" ${
  sql(report as Record<string, unknown>, ...Object.keys(report))
} RETURNING "kbReport".id
      `

      sqlId = id
    }

    const channel = await this.getChannel(interaction, settings.staffChannel)

    if (!isGuildTextBased(channel)) { // must be text based already, this checks for null
      return {
        content: 'The staff channel is not available.',
        ephemeral: true
      }
    }

    await channel.send({
      allowedMentions: { parse: ['everyone'] },
      content: `${channel.guild.roles.everyone}`,
      embeds: [
        Embed.json({
          color: colors.ok,
          description: stripIndents`
          ${bold('Reason:')} ${reason}
          
          ${bold('Attachments:')}
          ${attachments.join('\n')}
          `,
          author: {
            name: `${interaction.user.tag} (${interaction.user.id})`,
            icon_url: interaction.user.displayAvatarURL()
          },
          fields: [
            { name: subcommand === 'user' ? 'User:' : 'Message:', value: display, inline: true },
            { name: 'Reported by:', value: `${interaction.user}`, inline: true },
            { name: 'Case:', value: sqlId.toLocaleString(), inline: true }
          ]
        })
      ],
      components: [
        Components.actionRow([
          Buttons.primary('Ban', `report::ban::${sqlId}`),
          Buttons.primary('Kick', `report::kick::${sqlId}`),
          Buttons.primary('Softban', `report::softban::${sqlId}`),
          Buttons.secondary('Ignore', `report::ignore::${sqlId}`)
        ])
      ]
    })
  }

  async getMessage (
    { guild, guildId, client }: ChatInputCommandInteraction,
    fallback: string[]
  ): Promise<Message<true>> {
    const [, channelId, messageId] = fallback

    guild ??= await client.guilds.fetch({ guild: guildId! })
    const channel = await guild.channels.fetch(channelId)
    assert(isGuildTextBased(channel))
    return await channel.messages.fetch(messageId)
  }

  async getChannel (
    { guild, client, guildId }: ChatInputCommandInteraction,
    channelId: string
  ): Promise<GuildBasedChannel | null> {
    guild ??= await client.guilds.fetch({ guild: guildId! })

    return await guild.channels.fetch(channelId)
  }
}

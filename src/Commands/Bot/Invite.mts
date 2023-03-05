import { Command } from '#khaf/Command'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { bold } from '@discordjs/builders'
import { OAuth2Scopes, PermissionFlagsBits, type APIEmbed } from 'discord-api-types/v10'
import type { Message } from 'discord.js'

const scopes = [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands]
const permissions = [
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

export class kCommand extends Command {
  constructor () {
    super([
      'Get the invite links for the bot! :)'
    ], {
      name: 'invite',
      folder: 'Bot',
      args: [0, 0],
      ratelimit: 3,
      aliases: ['botinvite']
    })
  }

  init (message: Message): APIEmbed {
    const everything = message.client.generateInvite({ scopes, permissions })
    const slashCommands = message.client.generateInvite({ scopes, permissions: 0n })

    return Embed.json({
      color: colors.ok,
      fields: [
        { name: bold('Everything:'), value: everything },
        { name: bold('Enable slash commands and buttons:'), value: slashCommands }
      ]
    })
  }
}

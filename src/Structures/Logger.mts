import type { Guild, Interaction, Message, Role, User } from 'discord.js'
import { pino } from 'pino'

export const logger = pino({
  base: null
})

export const loggerUtility = {
  formatters: {
    guild(guild: Guild): Record<string, unknown> {
      return {
        guildId: guild.id,
        members: guild.memberCount,
        ownerId: guild.ownerId,
        name: guild.name
      }
    },
    user(user: User): Record<string, unknown> {
      return {
        userId: user.id,
        tag: user.tag
      }
    },
    message(message: Message): Record<string, unknown> {
      return {
        messageId: message.id,
        user: loggerUtility.formatters.user(message.author),
        guild: message.guild ? loggerUtility.formatters.guild(message.guild) : undefined,
        channelId: message.channel.id
      }
    }
  },
  logGuild(guild: Guild, message?: string): void {
    logger.info(loggerUtility.formatters.guild(guild), message)
  },
  logRole(role: Role, message?: string, extra?: Record<string, unknown>): void {
    const obj = {
      roleId: role.id,
      name: role.name,
      permissions: role.permissions.bitfield,
      ...extra
    } as const

    logger.info(obj, message)
  },
  logInteraction(interaction: Interaction, message?: string): void {
    const obj = {
      interactionId: interaction.id,
      channelId: interaction.channelId,
      user: loggerUtility.formatters.user(interaction.user),
      guild: interaction.guild ? loggerUtility.formatters.guild(interaction.guild) : undefined
    } as const

    logger.info(obj, message)
  }
} as const

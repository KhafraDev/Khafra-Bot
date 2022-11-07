import { Event } from '#khaf/Event'
import { logger, loggerUtility } from '#khaf/structures/Logger.js'
import { Embed } from '#khaf/utility/Constants/Embeds.js'
import { validSnowflake } from '#khaf/utility/Mentions.js'
import { hierarchy } from '#khaf/utility/Permissions.js'
import { InteractionType, type APIEmbed } from 'discord-api-types/v10'
import { Events, type Interaction, type Role } from 'discord.js'

export class kEvent extends Event<typeof Events.InteractionCreate> {
  name = Events.InteractionCreate as const

  async init (interaction: Interaction): Promise<void> {
    if (interaction.type !== InteractionType.MessageComponent) {
      return
    } else if (!interaction.inCachedGuild()) {
      // https://github.com/discordjs/discord.js/blob/8f6df90035e964d8779a6aab716c2f7f138975d5/src/structures/Interaction.js#L175
      // interaction.member and interaction.guild exist
      return
    } else if (
      !interaction.customId.includes('react-role') &&
      !validSnowflake(interaction.customId) || // old ids were just the role ids
      interaction.message.author.id !== interaction.client.user.id
    ) {
      return
    }

    const { guild, member, customId } = interaction

    let action = 'default'
    // old react-roles set the customId as the role id
    let roleId = interaction.customId

    if (customId.startsWith('react-role,')) {
      // react-role,action,roleId
      const split = interaction.customId.split(',')

      action = split[1]
      roleId = split[2]
    }

    const role = await guild.roles.fetch(roleId).catch(() => null)

    if (role !== null) {
      loggerUtility.logRole(role, 'react role', {
        ...loggerUtility.formatters.guild(guild),
        ...loggerUtility.formatters.user(interaction.user)
      })
    }

    if (role === null) {
      return void await interaction.reply({
        content: '❌ This role isn\'t cached or has been deleted.',
        ephemeral: true
      })
    } else if (!guild.members.me || !hierarchy(guild.members.me, member, false)) {
      return void await interaction.reply({
        content: '❌ I do not have permission to manage your roles!',
        ephemeral: true
      })
    }

    try {
      const had = member.roles.cache.has(role.id)
      const opts = { ephemeral: true, embeds: [] as APIEmbed[] } as const

      const add = async (role: Role): Promise<void> => {
        await member.roles.add(role)
        opts.embeds.push(Embed.ok(`Granted you the ${role} role!`))
      }

      const remove = async (role: Role): Promise<void> => {
        await member.roles.remove(role)
        opts.embeds.push(Embed.ok(`Removed role ${role} from you!`))
      }

      if (action === 'add') {
        if (had === true) {
          opts.embeds.push(Embed.ok('This role can only be added, and you already have it.'))
        } else {
          await add(role)
        }
      } else if (action === 'remove') {
        if (had === false) {
          opts.embeds.push(Embed.ok('This role can only be removed, and you don\'t have it.'))
        } else {
          await remove(role)
        }
      } else {
        if (had) {
          await remove(role)
        } else {
          await add(role)
        }
      }

      return void await interaction.reply(opts)
    } catch (e) {
      logger.error(e, 'react role error')

      return void await interaction.reply({
        embeds: [
          Embed.error('An error prevented me from granting you the role!')
        ],
        ephemeral: true
      })
    }
  }
}

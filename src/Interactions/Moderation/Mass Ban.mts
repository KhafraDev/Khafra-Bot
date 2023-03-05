import { Interactions } from '#khaf/Interaction'
import { days } from '#khaf/utility/ms.mjs'
import { bitfieldToString } from '#khaf/utility/Permissions.mjs'
import type {
  APIApplicationCommandOption,
  RESTPostAPIApplicationCommandsJSONBody
} from 'discord-api-types/v10'
import {
  ApplicationCommandOptionType,
  PermissionFlagsBits
} from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, GuildMemberManager, InteractionReplyOptions } from 'discord.js'
import { setTimeout } from 'node:timers/promises'

const perms = PermissionFlagsBits.BanMembers
const deleteMessageSeconds = days(0.007) // 7 days in seconds

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'massban',
      description: 'Ban someone!',
      default_member_permissions: bitfieldToString([perms]),
      dm_permission: false,
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'reason',
          description: 'The reason you are banning the members for.'
        },
        ...Array.from({ length: 19 }, (_, i): APIApplicationCommandOption => ({
          type: ApplicationCommandOptionType.User,
          name: `member${i + 1}`,
          description: 'Member to ban.'
        }))
      ]
    }

    super(sc, {
      defer: true
    })
  }

  async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | undefined> {
    if (!interaction.memberPermissions?.has(perms)) {
      return {
        content: '❌ You do not have permission to use this command!',
        ephemeral: true
      }
    } else if (
      interaction.guild === null ||
      !interaction.guild.members.me ||
      !interaction.guild.members.me.permissions.has(perms)
    ) {
      return {
        content: '❌ I do not have full permissions in this guild, please re-invite with permission to manage channels.',
        ephemeral: true
      }
    }

    const reason =
      interaction.options.getString('reason') ??
      `Requested by ${interaction.user.tag} (${interaction.user.id})`

    const users = new Map<string, ReturnType<GuildMemberManager['ban']>>()

    for (let i = 1; i < 18; i++) {
      const userOption = interaction.options.getUser(`member${i}`)

      if (userOption) {
        const member = interaction.options.getMember(`member${i}`)

        if (member) {
          const memberPerms = typeof member.permissions !== 'string'
            ? member.permissions.bitfield
            : BigInt(member.permissions)

          // If the member listed has permission to ban, disallow banning them.
          if ((perms & memberPerms) === perms) {
            return {
              content: `❌ I cannot ban ${member}!`,
              ephemeral: true
            }
          }
        }

        users.set(
          userOption.id,
          interaction.guild.members.ban(userOption, {
            reason, deleteMessageSeconds
          })
        )
      }
    }

    await interaction.editReply({
      content: '✅ Starting to ban these members... if you provided multiple, it may take a minute!'
    })

    let description = ''
    for (const [id, user] of users.entries()) {
      try {
        const r = await user
        description += `• Successfully banned ${r}\n`
      } catch (e) {
        description += `⨯ Failed to ban ${id}\n`
      } finally {
        // The less users there are, the less delay
        // we need as there's less chance of a ratelimit.
        await setTimeout(users.size ** 2 * 10)
      }
    }

    return void interaction.followUp({
      content: description
    })
  }
}

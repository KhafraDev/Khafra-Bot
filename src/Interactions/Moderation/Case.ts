import { Interactions } from '#khaf/Interaction'
import { toString } from '#khaf/utility/Permissions.js'
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import { ApplicationCommandOptionType, PermissionFlagsBits } from 'discord-api-types/v10'

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'case',
      description: 'Staff commands for viewing and modifying reports.',
      default_member_permissions: toString([PermissionFlagsBits.KickMembers]),
      dm_permission: false,
      options: [
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'view-user',
          description: 'View active/inactive/all reports against a user.',
          options: [
            {
              type: ApplicationCommandOptionType.User,
              name: 'member',
              description: 'the user to view reports against.',
              required: true
            }
          ]
        }
      ]
    }

    super(sc, {
      defer: true
    })
  }
}

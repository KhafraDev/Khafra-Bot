import { Interactions } from '#khaf/Interaction'
import { bitfieldToString } from '#khaf/utility/Permissions.mjs'
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import { ApplicationCommandOptionType, ChannelType, PermissionFlagsBits } from 'discord-api-types/v10'

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'giveaway',
      description: 'Giveaway settings.',
      default_member_permissions: bitfieldToString([PermissionFlagsBits.ManageEvents]),
      dm_permission: false,
      options: [
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'create',
          description: 'Create a giveaway in the guild.',
          options: [
            {
              type: ApplicationCommandOptionType.Channel,
              name: 'channel',
              description: 'Channel to create the giveaway in.',
              required: true,
              channel_types: [
                ChannelType.GuildAnnouncement,
                ChannelType.GuildText
              ]
            },
            {
              type: ApplicationCommandOptionType.String,
              name: 'prize',
              description: 'The prize that is being given away.',
              required: true
            },
            {
              type: ApplicationCommandOptionType.String,
              name: 'ends',
              description: 'When the giveaway ends ("1h 30m", "December 3 2022", or timestamp). '
                + 'tiny.one/d6j7f328 for timestamps',
              required: true
            },
            {
              type: ApplicationCommandOptionType.Integer,
              name: 'winners',
              description: 'The number of winners there should be, defaults to 1.',
              min_value: 1,
              max_value: 100
            }
          ]
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'delete',
          description: 'Stops a running giveaway.',
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: 'id',
              description: 'The id of the giveaway.',
              required: true
            }
          ]
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'reroll',
          description: 'Rerolls a giveaway that has ended, picking new winners.',
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: 'giveaway-id-or-prize',
              description: 'The id of the giveaway, or a piece of the prize.',
              required: true
            }
          ]
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'end',
          description: 'Immediately ends a giveaway.',
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: 'giveaway-id-or-prize',
              description: 'The id of the giveaway, or a piece of the prize.',
              required: true
            }
          ]
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'view',
          description: 'View all, ended, or active giveaways.'
        }
      ]
    }

    super(sc, {
      defer: true
    })
  }
}

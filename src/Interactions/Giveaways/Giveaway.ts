import { Interactions } from '#khaf/Interaction'
import { toString } from '#khaf/utility/Permissions.js'
import type {
  RESTPostAPIApplicationCommandsJSONBody
} from 'discord-api-types/v10'
import {
  ApplicationCommandOptionType,
  ChannelType,
  PermissionFlagsBits
} from 'discord-api-types/v10'

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'giveaway',
      description: 'Giveaway settings.',
      default_member_permissions: toString([PermissionFlagsBits.ManageEvents]),
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
                ChannelType.GuildAnnouncement, ChannelType.GuildText
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
              description: 'How long the giveaway should last (for example: "1h 30m" or "2w 3d 1h").',
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
          description: 'View all, ended, or active giveaways.',
          options: [
            {
              type: ApplicationCommandOptionType.Boolean,
              name: 'all',
              description: 'View all your giveaways.'
            },
            {
              type: ApplicationCommandOptionType.Boolean,
              name: 'active',
              description: 'View all of your ongoing giveaways.'
            },
            {
              type: ApplicationCommandOptionType.Boolean,
              name: 'ended',
              description: 'View all of your giveaways that have already ended.'
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

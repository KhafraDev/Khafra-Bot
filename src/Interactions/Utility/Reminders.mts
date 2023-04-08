import { Interactions } from '#khaf/Interaction'
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import { ApplicationCommandOptionType } from 'discord-api-types/v10'

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'reminders',
      description: 'Handle and modify your reminders!',
      options: [
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'create',
          description: 'Create a reminder',
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: 'message',
              description: 'The message the bot should remind you of.',
              required: true
            },
            {
              type: ApplicationCommandOptionType.String,
              name: 'time',
              description:
                'When to remind you ("1h 30m", "December 3 2022", or timestamp). ' +
                'tiny.one/d6j7f328 for timestamps.',
              required: true
            },
            {
              type: ApplicationCommandOptionType.Boolean,
              name: 'repeat',
              description: 'If this reminder should be repeatedly sent to you on an interval (default is false).'
            },
            {
              type: ApplicationCommandOptionType.String,
              name: 'interval',
              description: 'Interval when to re-remind you after the first reminder.'
            }
          ]
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'edit',
          description: 'Edits an existing reminder',
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: 'id',
              description: 'The ID of the reminder.',
              required: true
            },
            {
              type: ApplicationCommandOptionType.String,
              name: 'message',
              description: 'The new message the bot should remind you of.'
            },
            {
              type: ApplicationCommandOptionType.String,
              name: 'time',
              description:
                'When to remind you ("1h 30m", "December 3 2022", or timestamp). ' +
                'tiny.one/d6j7f328 for timestamps.'
            },
            {
              type: ApplicationCommandOptionType.Boolean,
              name: 'repeat',
              description: 'If this reminder should be repeatedly sent to you on an interval.'
            },
            {
              type: ApplicationCommandOptionType.String,
              name: 'interval',
              description: 'Interval when to re-remind you after the first reminder.'
            }
          ]
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'view',
          description: 'Fetches a list of your current reminders.'
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'delete',
          description: 'Deletes one or more reminders.',
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: 'id',
              description: 'ID(s) to delete, comma separated for multiple.',
              required: true
            }
          ]
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'pause',
          description: 'Pause a reminder if one is active, or unpauses it if paused.',
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: 'id',
              description: 'The ID of the reminder.',
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

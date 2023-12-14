import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import { ApplicationCommandOptionType } from 'discord-api-types/v10'
import { Interactions } from '#khaf/Interaction'

export class kInteraction extends Interactions {
  constructor() {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'animal',
      description: 'Get pictures of cute animals!!',
      options: [
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'bird',
          description: 'Pictures of birds!! 🐦'
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'bunny',
          description: 'Pictures of bunnies!! 🐰'
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'cat',
          description: 'Pictures of cats!! 🐱'
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'dog',
          description: 'Pictures of dogs!! 🐶'
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'duck',
          description: 'Pictures of ducks!! 🦆'
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'fox',
          description: 'Pictures of foxes!! 🦊'
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'koala',
          description: 'Pictures of koalas!! 🐨'
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'lizard',
          description: 'Pictures of lizards!! 🦎'
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'panda',
          description: 'Pictures of pandas!! 🐼'
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'redpanda',
          description: 'Pictures of red pandas!! 🐼'
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'shibe',
          description: 'Pictures of shiba inus!! 🐶'
        }
      ]
    }

    super(sc)
  }
}

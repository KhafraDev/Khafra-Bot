import { Interactions } from '#khaf/Interaction'
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import { ApplicationCommandOptionType } from 'discord-api-types/v10'

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'minecraft',
      description: 'MineCraft commands!',
      options: [
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'capes',
          description: 'Get a player\'s capes!',
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: 'username',
              description: 'MineCraft username to get a list of capes from!',
              required: true
            }
          ]
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'skin',
          description: 'Get a render of a player\'s current skin!',
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: 'username',
              description: 'MineCraft username to get a list of skin from!',
              required: true
            },
            {
              type: ApplicationCommandOptionType.String,
              name: 'type',
              description: 'Type of render to get (defaults to front).',
              choices: [
                { name: 'face', value: 'face' },
                { name: '3d-head', value: 'head' },
                { name: 'front', value: 'frontfull' },
                { name: '3d-full', value: 'full' },
                { name: 'skin', value: 'skin' }
              ]
            }
          ]
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'name-history',
          description: 'Get a player\'s previous name history!',
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: 'username',
              description: 'MineCraft username to get the name history of.',
              required: true
            }
          ]
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'recipe',
          description: 'Get a crafting recipe for an item.',
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: 'item',
              description: 'The display name of the item',
              required: true,
              autocomplete: true
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

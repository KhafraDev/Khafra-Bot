import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import { ApplicationCommandOptionType } from 'discord-api-types/v10'
import { Interactions } from '#khaf/Interaction'

export class kInteraction extends Interactions {
  constructor() {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'memes',
      description: 'The base command for the PseudoBot meme creator!',
      options: [
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'ifunny',
          description: 'Show how funny a meme is by placing an iFunny watermark under it.',
          options: [
            {
              type: ApplicationCommandOptionType.Attachment,
              name: 'image',
              description: 'The image you want an iFunny watermark on.',
              required: true
            }
          ]
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'triggered',
          description: 'Make this person triggered!',
          options: [
            {
              type: ApplicationCommandOptionType.User,
              name: 'person',
              description: "The person who's triggered!",
              required: true
            }
          ]
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'megamind',
          description: 'No beaches?',
          options: [
            {
              type: ApplicationCommandOptionType.String,
              name: 'text',
              description: 'Meme text: "No beaches?"',
              required: true
            }
          ]
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'america',
          description: 'Americanize someone!',
          options: [
            {
              type: ApplicationCommandOptionType.User,
              name: 'person',
              description: 'Person to American-ize!'
            }
          ]
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'communism',
          description: 'Make someone a communist!',
          options: [
            {
              type: ApplicationCommandOptionType.User,
              name: 'person',
              description: 'Person to radicalize!'
            }
          ]
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'deep-fry',
          description: "Deep-fry someone's avatar or image!",
          options: [
            {
              type: ApplicationCommandOptionType.User,
              name: 'person',
              description: "Person's avatar to deep fry."
            },
            {
              type: ApplicationCommandOptionType.Attachment,
              name: 'image',
              description: 'Image to deep fry.'
            }
          ]
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: 'magik',
          description: 'Magik-ify a person or image!',
          options: [
            {
              type: ApplicationCommandOptionType.User,
              name: 'person',
              description: "Person's avatar to magik-ify."
            },
            {
              type: ApplicationCommandOptionType.Attachment,
              name: 'image',
              description: 'Image to magik-ify.'
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

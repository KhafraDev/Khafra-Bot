import { Interactions } from '#khaf/Interaction'
import { owlbotio } from '#khaf/utility/commands/OwlBotIO'
import { maxDescriptionLength } from '#khaf/utility/constants.js'
import { Buttons, Components } from '#khaf/utility/Constants/Components.js'
import { stripIndents } from '#khaf/utility/Template.js'
import { bold, italic } from '@discordjs/builders'
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import { ApplicationCommandOptionType } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'dictionary',
      description: 'Gets the definition of a word or phrase!',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'word',
          description: 'The word or phrase to define.',
          required: true
        }
      ]
    }

    super(sc)
  }

  async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const phrase = interaction.options.getString('word', true)
    const word = await owlbotio(phrase)

    if (word?.definitions === undefined) {
      return {
        content: '❌ No definition found!',
        ephemeral: true
      }
    }

    const definitions = word.definitions
      .map(w => `${italic(w.type)} - ${w.definition}${w.emoji ? ` ${w.emoji}` : ''}`)
      .join('\n')
      .slice(0, maxDescriptionLength - word.word.length - (word.pronunciation ? word.pronunciation.length + 2 : 0))

    return {
      content: stripIndents`
            ${bold(word.word)} ${word.pronunciation ? `(${word.pronunciation})` : ''}
            ${definitions}`,
      components: [
        Components.actionRow([
          Buttons.link(
            'Go to Dictionary',
            `https://www.dictionary.com/browse/${encodeURIComponent(phrase)}`
          )
        ])
      ]
    }
  }
}

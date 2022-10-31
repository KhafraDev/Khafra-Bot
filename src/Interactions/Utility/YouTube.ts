import { Interactions } from '#khaf/Interaction'
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.js'
import { s } from '@sapphire/shapeshift'
import {
  ApplicationCommandOptionType,
  InteractionType,
  type RESTPostAPIApplicationCommandsJSONBody
} from 'discord-api-types/v10'
import {
  InteractionCollector,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type InteractionReplyOptions
} from 'discord.js'
import { randomUUID } from 'node:crypto'
import { URL } from 'node:url'
import { request } from 'undici'

const base = 'https://duckduckgo.khafra.workers.dev'
const schema = s.string.array.lengthGreaterThan(0)

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'youtube',
      description: 'Gets YouTube videos matching your search.',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'search',
          description: 'Videos to search for.',
          required: true
        }
      ]
    }

    super(sc, { defer: true })
  }

  async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | undefined> {
    const query = interaction.options.getString('search', true)
      .replaceAll(':', '-')

    const url = new URL(base)
    url.searchParams.set('q', query)

    const { body } = await request(url)
    const result: unknown = await body.json()

    if (!!result && typeof result === 'object' && 'error' in result) {
      return {
        content: 'An unexpected error occurred, sorry! :(',
        ephemeral: true
      }
    }

    if (!schema.is(result)) {
      return {
        content: 'No results found!',
        ephemeral: true
      }
    }

    let currentPage = 0
    const id = randomUUID()
    const int = await interaction.editReply({
      content: result[currentPage],
      components: [
        Components.actionRow([
          Buttons.approve('Next', `next-${id}`),
          Buttons.secondary('Previous', `back-${id}`),
          Buttons.deny('Stop', `stop-${id}`)
        ])
      ]
    })

    const collector = new InteractionCollector<ButtonInteraction>(interaction.client, {
      interactionType: InteractionType.MessageComponent,
      message: int,
      idle: 120_000,
      filter: (i) =>
        i.message.id === int.id &&
                i.user.id === interaction.user.id &&
                i.customId.endsWith(id)
    })

    for await (const [collected] of collector) {
      const [action] = collected.customId.split('-')

      if (action === 'stop') break

      action === 'next' ? currentPage++ : currentPage--
      if (currentPage < 0) currentPage = result.length - 1
      if (currentPage >= result.length) currentPage = 0

      await collected.update({
        content: result[currentPage]
      })
    }

    const last = collector.collected.last()

    if (
      collector.collected.size !== 0 &&
            last?.replied === false
    ) {
      return void await last.update({
        components: disableAll(int)
      })
    }

    return void await interaction.editReply({
      components: disableAll(int)
    })
  }
}

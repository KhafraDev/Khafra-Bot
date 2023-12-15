import { Interactions } from '#khaf/Interaction'
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.mjs'
import { minutes } from '#khaf/utility/ms.mjs'
import { s } from '@sapphire/shapeshift'
import {
  ApplicationCommandOptionType,
  InteractionType,
  type RESTPostAPIApplicationCommandsJSONBody
} from 'discord-api-types/v10'
import {
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  InteractionCollector,
  type InteractionReplyOptions
} from 'discord.js'
import { randomUUID } from 'node:crypto'
import { env } from 'node:process'
import { stringify } from 'node:querystring'
import { URL } from 'node:url'
import { request } from 'undici'

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

    const params = stringify({ q: query })
    const url = new URL(`/ddg/search/?${params}`, env.WORKER_API_BASE)

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
      idle: minutes(2),
      filter: (i) =>
        i.message.id === int.id
        && i.user.id === interaction.user.id
        && i.customId.endsWith(id)
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
      collector.collected.size !== 0
      && last?.replied === false
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

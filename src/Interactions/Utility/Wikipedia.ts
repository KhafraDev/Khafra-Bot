import { search } from '#khaf/functions/wikipedia/search.js'
import { extractArticleText } from '#khaf/functions/wikipedia/source.js'
import { Interactions } from '#khaf/Interaction'
import { Buttons, Components } from '#khaf/utility/Constants/Components.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { minutes } from '#khaf/utility/ms.js'
import { ellipsis, plural } from '#khaf/utility/String.js'
import { splitEvery } from '#khaf/utility/util.js'
import { hideLinkEmbed } from '@discordjs/builders'
import {
  ApplicationCommandOptionType,
  InteractionType,
  type RESTPostAPIApplicationCommandsJSONBody
} from 'discord-api-types/v10'
import type { ButtonInteraction, InteractionEditReplyOptions, StringSelectMenuInteraction } from 'discord.js'
import { InteractionCollector, type ChatInputCommandInteraction, type InteractionReplyOptions } from 'discord.js'
import assert from 'node:assert'
import { randomUUID } from 'node:crypto'

interface WikiCache {
  text: string[]
  article: {
    pageid: number
    ns: number
    title: string
    extract: string
  }
}

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'wikipedia',
      description: 'Retrieves the content of a Wikipedia article.',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'article',
          description: 'the article\'s title',
          required: true
        }
      ]
    }

    super(sc, { defer: true })
  }

  async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | undefined> {
    const content = interaction.options.getString('article', true)
    const wiki = await search(content)
    const id = randomUUID()

    if (wiki.pages.length === 0) {
      return {
        content: '❌ No Wikipedia articles for that query were found!',
        ephemeral: true
      }
    }

    const components = {
      selectMenu: Components.actionRow([
        Components.selectMenu({
          custom_id: `wikipedia-${id}`,
          placeholder: 'Which article summary would you like to get?',
          options: wiki.pages.map(w => ({
            label: ellipsis(w.title, 25),
            description: ellipsis(w.excerpt.replaceAll(/<span.*?>(.*?)<\/span>/g, '$1'), 50),
            value: `${w.id}`
          }))
        })
      ]),
      buttons: Components.actionRow([
        Buttons.approve('Next', `next-${id}`),
        Buttons.primary('Back', `back-${id}`)
      ]),
      get all () {
        return [
          this.buttons,
          this.selectMenu
        ]
      }
    } as const

    const m = await interaction.editReply({
      content: `${wiki.pages.length} result${plural(wiki.pages.length)} found!`,
      embeds: [
        Embed.ok('Choose an article from the dropdown below!')
      ],
      components: [components.selectMenu]
    })

    let page = 0
    const cache = new Map<string, WikiCache>()

    const c = new InteractionCollector<
      StringSelectMenuInteraction | ButtonInteraction
    >(interaction.client, {
      interactionType: InteractionType.MessageComponent,
      message: m,
      time: minutes(10),
      filter: (i) =>
        i.user.id === interaction.user.id &&
        i.message.id === m.id &&
        i.customId.endsWith(id)
    })

    let article!: WikiCache

    for await (const [i] of c) {
      if (i.isStringSelectMenu()) {
        const id = i.values[0]

        if (!cache.has(id)) {
          await i.deferUpdate()

          const result = await extractArticleText(id)
          const article = result.query.pages?.[id]
          assert(article)
          const text = article.extract.split(/\n{3,}/g)
          const parts: string[] = []

          for (const part of text.map(p => splitEvery(p, 4096)).flat()) {
            if (parts.length === 0) {
              parts.push(part)
              continue
            }

            const last = parts.at(-1)!

            if (part.length + last.length > 4096) {
              parts.push(part)
            } else {
              parts[parts.length - 1] = `${last} ${part}`
            }
          }

          cache.set(id, { text: parts, article })
        }

        article = cache.get(id)!
        page = 0
      } else {
        i.customId.startsWith('next') ? page++ : page--
        if (page < 0) page = article.text.length - 1
        if (page >= article.text.length) page = 0
      }

      const rows = article.text.length > 1 ? components.all : undefined
      const options = {
        content: hideLinkEmbed(`https://en.wikipedia.org/wiki/${encodeURIComponent(article.article.title)}`),
        embeds: [
          Embed.json({
            color: colors.ok,
            description: article.text[page],
            title: article.article.title,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(article.article.title)}`
          })
        ],
        components: rows
      } satisfies InteractionEditReplyOptions

      if (i.deferred) {
        await i.editReply(options)
      } else {
        await i.update(options)
      }
    }
  }
}

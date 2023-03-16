import { colors, maxContentLength, routes } from '#/lib/constants.mjs'
import { htmlToMarkdown, randomSplit } from '#/lib/mdn.mjs'
import { mdnIndexSchema } from '#/lib/schema.mjs'
import { assert } from '#/lib/util.mjs'
import type { InteractionHandler } from '#/types'
import {
  ComponentType,
  InteractionResponseType,
  MessageFlags,
  type APIMessageComponentInteraction
} from 'discord-api-types/v10'

export const mdnSelectMenu: InteractionHandler<APIMessageComponentInteraction> = {
  async run (interaction) {
    assert(interaction.data.component_type === ComponentType.StringSelect)

    const slug = interaction.data.values[0]
    const value = new URL(`${slug}/index.json`, routes.mdn).toString()

    const response = await fetch(value)
    const body = await response.json()
    assert(mdnIndexSchema.is(body))

    const markdown = await htmlToMarkdown(body)
    const pieces = markdown.split(randomSplit)

    // TODO: allow different pages

    const pages: string[] = []
    let page = ''

    for (const piece of pieces) {
      if (page.length + piece.length > maxContentLength) {
        pages.push(page)
        page = ''
      } else {
        page += piece
      }
    }

    pages.push(page)

    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        embeds: [
          {
            color: colors.ok,
            title: body.doc.title ?? undefined,
            url: new URL(body.doc.mdn_url, routes.mdn).toString(),
            description: pages[0]
          }
        ],
        flags: MessageFlags.Ephemeral
      }
    }
  }
}

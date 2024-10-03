import { Interactions } from '#khaf/Interaction'
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.mjs'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { days, minutes } from '#khaf/utility/ms.mjs'
import { stripIndents } from '#khaf/utility/Template.mjs'
import { hideLinkEmbed } from '@discordjs/builders'
import { s } from '@sapphire/shapeshift'
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import {
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  InteractionCollector,
  type InteractionReplyOptions,
  type InteractionUpdateOptions
} from 'discord.js'
import assert from 'node:assert'
import { randomUUID } from 'node:crypto'
import { env } from 'node:process'
import { request } from 'undici'

const earliest = new Date('1995-06-16T00:00:00.000Z')

const apodSchema = s.object({
  explanation: s.string,
  url: s.string,
  title: s.string,
  mediaType: s.string,
  hdurl: s.string,
  copyright: s.string,
  link: s.string
})

const fetchApod = async (url: URL, id: string): Promise<InteractionReplyOptions> => {
  const { body } = await request(url)

  const result: unknown = await body.json()
  assert(apodSchema.is(result))

  if (result.mediaType === 'image') {
    const embed = Embed.json({
      color: colors.ok,
      title: result.title,
      url: result.link,
      image: {
        url: result.hdurl || result.url
      }
    })

    if (result.copyright.length) {
      embed.footer = { text: `© ${result.copyright}` }
    }

    return {
      embeds: [embed],
      fetchReply: true,
      components: [
        Components.actionRow([
          Buttons.approve('Next', `next-${id}`),
          Buttons.secondary('Previous', `back-${id}`),
          Buttons.deny('Stop', `stop-${id}`)
        ])
      ]
    }
  } else {
    return {
      content: stripIndents`
      ${result.title} - ${hideLinkEmbed(result.url)}
      ${result.copyright.length ? `© ${result.copyright}` : ''}
      ${result.hdurl || result.url}
      `,
      fetchReply: true,
      components: [
        Components.actionRow([
          Buttons.approve('Next', `next-${id}`),
          Buttons.secondary('Previous', `back-${id}`),
          Buttons.deny('Stop', `stop-${id}`)
        ])
      ]
    }
  }
}

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'nasa',
      description: 'Gets a random image of space from NASA!'
    }

    super(sc, { defer: true })
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<void> {
    const id = randomUUID()
    const utc = new Date()
    utc.setUTCHours(0)
    utc.setUTCMinutes(0)
    utc.setUTCSeconds(0)

    let date = utc.getTime() <= Date.now() ? new Date(Date.now() - days(1)) : utc

    const url = new URL('/nasa/apod/', env.WORKER_API_BASE)
    const reply = await interaction.editReply(await fetchApod(url, id))

    const collector = new InteractionCollector<ButtonInteraction>(interaction.client, {
      idle: minutes(3),
      message: reply,
      filter: (i) =>
        i.isButton()
        && interaction.user.id === i.user.id
        && i.customId.endsWith(id)
    })

    for await (const [i] of collector) {
      const [action] = i.customId.split('-')

      if (action === 'stop') {
        await i.update({
          components: disableAll(reply)
        })

        break
      } else if (action === 'next') {
        date.setDate(date.getDate() + 1)

        if (date.getTime() > Date.now()) {
          date = earliest
        }
      } else {
        date.setDate(date.getDate() - 1)

        if (date.getTime() <= earliest.getTime()) {
          date = new Date()
        }
      }

      url.searchParams.set('date', date.toString())
      await i.update(await fetchApod(url, id) as InteractionUpdateOptions)
    }

    if (collector.endReason === 'time' || collector.endReason === 'idle' && reply.editable) {
      await reply.edit({
        components: disableAll(reply)
      })
    }
  }
}

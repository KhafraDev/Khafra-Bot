import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import { sql } from '#khaf/database/Postgres.mjs'
import { Pocket } from '#khaf/functions/pocket/Pocket.mjs'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { codeBlock, inlineCode } from '@discordjs/builders'
import { s } from '@sapphire/shapeshift'
import type { APIEmbed } from 'discord-api-types/v10'
import type { Message } from 'discord.js'
import { URL } from 'node:url'

const schema = s.string.url({
  allowedProtocols: ['http:', 'https:']
}).transform((value) => {
  const url = new URL(value)
  url.search = ''
  return url
})

interface PocketUser {
  access_token: string
  request_token: string
  username: string
}

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Pocket: add an article, video, or image to your saved items!',
        'https://www.bbc.com/culture/article/20160819-the-21st-centurys-100-greatest-films '
        + 'The 21st Century’s 100 greatest films'
      ],
      {
        name: 'pocketadd',
        folder: 'Pocket',
        args: [1]
      }
    )
  }

  async init (message: Message, { args }: Arguments): Promise<APIEmbed> {
    const rows = await sql<[PocketUser] | []>`
      SELECT access_token, request_token, username
      FROM kbPocket
      WHERE user_id = ${message.author.id}::text
      LIMIT 1;
    `

    if (rows.length === 0) {
      return Embed.error(`
      You haven't set-up Pocket integration!

      Try using the ${inlineCode('pocket')} command for more information.
      `)
    }

    const pocket = new Pocket(rows.shift())
    const article = schema.run(args[0])
    if (!article.isOk()) {
      return Embed.error('That\'s not an article URL, try again!')
    }
    const added = await pocket.add(article.value, args.slice(1).join(' '))

    return Embed.json({
      color: colors.ok,
      title: added.item.title,
      author: {
        name: added.item.domain_metadata?.name ?? message.author.username,
        url: added.item.domain_metadata?.logo ?? undefined,
        icon_url: added.item.resolved_normal_url
      },
      description: `
        Added [${added.item.title}](${added.item.resolved_normal_url}) to your Pocket list!
        ${codeBlock(added.item.excerpt?.slice(0, 1024) ?? 'N/A')}`,
      timestamp: new Date(added.item.date_published).toISOString(),
      footer: { text: 'Published' }
    })
  }
}

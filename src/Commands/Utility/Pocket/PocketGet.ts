import { Command } from '#khaf/Command'
import { sql } from '#khaf/database/Postgres.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { inlineCode } from '@discordjs/builders'
import { Pocket } from '@khaf/pocket'
import type { APIEmbed } from 'discord-api-types/v10'
import type { Message } from 'discord.js'

interface PocketUser {
    access_token: string
    request_token: string
    username: string
}

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Pocket: retrieve your saved items!'
      ],
      {
        name: 'pocketget',
        folder: 'Pocket',
        args: [0, 0]
      }
    )
  }

  async init (message: Message): Promise<APIEmbed> {
    const rows = await sql<[PocketUser] | []>`
      SELECT access_token, request_token, username
      FROM kbPocket
      WHERE user_id = ${message.author.id}::text
      LIMIT 1;
    `

    if (rows.length === 0)
      return Embed.error(`
      You haven't set-up Pocket integration!

      Try using the ${inlineCode('pocket')} command for more information.
      `)

    const pocket = new Pocket(rows.shift())
    const latest = await pocket.getList()

    const formatted = Object.values(latest.list)
      .map(item => `[${item.resolved_title}](${item.resolved_url})`)
      .join('\n')

    return Embed.json({
      color: colors.ok,
      description: formatted,
      author: {
        name: message.author.username + '\'s latest saves',
        icon_url: message.author.displayAvatarURL(),
        url: 'https://getpocket.com/'
      }
    })
  }
}

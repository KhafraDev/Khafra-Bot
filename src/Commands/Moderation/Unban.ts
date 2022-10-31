import type { Arguments} from '#khaf/Command'
import { Command } from '#khaf/Command'
import { Embed } from '#khaf/utility/Constants/Embeds.js'
import { dontThrow } from '#khaf/utility/Don\'tThrow.js'
import { getMentions } from '#khaf/utility/Mentions.js'
import { inlineCode } from '@discordjs/builders'
import type { APIEmbed} from 'discord-api-types/v10'
import { PermissionFlagsBits } from 'discord-api-types/v10'
import type { Message } from 'discord.js'
import { parseArgs } from 'node:util'

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Unban a user from the guild.',
        '1234567891234567 for apologizing',
        '9876543217654321',
        '1234567891234567 --reason apologized nicely :)'
      ],
      {
        name: 'unban',
        folder: 'Moderation',
        args: [1],
        guildOnly: true,
        permissions: [PermissionFlagsBits.BanMembers]
      }
    )
  }

  async init (message: Message<true>, { args, content }: Arguments): Promise<APIEmbed> {
    const user = await getMentions(message, 'users', content)
    const { values: cli } = parseArgs({
      args,
      allowPositionals: true,
      options: {
        reason: {
          type: 'string',
          short: 'r'
        }
      }
    })

    if (!user)
      return Embed.error('Invalid ID or the user couldn\'t be fetched, sorry! 😕')

    const reason = cli['reason'] ?? args.slice(1).join(' ')
    const [e] = await dontThrow(message.guild.members.unban(user, reason))

    if (e !== null) {
      return Embed.error(`Couldn't unban ${user}, try again?\n${inlineCode(`${e}`)}`)
    }

    return Embed.ok(`${user} is now unbanned!`)
  }
}

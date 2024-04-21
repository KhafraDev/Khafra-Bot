import { Command } from '#khaf/Command'
import { type Message, PermissionFlagsBits } from 'discord.js'
import { inspect } from 'node:util'

let list: string[]

export class kCommand extends Command {
  constructor () {
    super([
      'Kick spy accounts.'
    ], {
      name: 'kick-the-spy',
      folder: 'Bot',
      args: [0, 0],
      ratelimit: 0,
      permissions: [PermissionFlagsBits.BanMembers, PermissionFlagsBits.KickMembers]
    })
  }

  async init (message: Message): Promise<string> {
    if (!list) {
      list = []
      list.push(...await (await fetch('https://kickthespy.pet/ids')).json() as string[])
    }

    const response = await message.guild?.members.fetch({
      user: list
    })

    if (response?.size) {
      return `There were some bots detected in your server: ${inspect(response)}`
    }

    return 'No spies found, cool!'
  }
}

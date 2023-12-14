import { inlineCode } from '@discordjs/builders'
import type { APIEmbed } from 'discord-api-types/v10'
import type { Message } from 'discord.js'
import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import { Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { pasteAliases } from '#khaf/utility/commands/Pastes'

const keys = ['pastebin', ...pasteAliases.keys()]

export class kCommand extends Command {
  constructor() {
    super(
      [
        'Upload a paste to a number of different pastebin services!',
        ...keys.slice(1).map((k) => `${k} const bot = KhafraClient;`)
      ],
      {
        name: 'pastebin',
        folder: 'Utility',
        args: [0],
        aliases: [...pasteAliases.keys()]
      }
    )
  }

  async init(_message: Message, { content, commandName }: Arguments): Promise<APIEmbed> {
    const command = commandName.toLowerCase()

    if (command === 'pastebin' || content.length === 0)
      return Embed.ok(`
      Here is a list of the sites currently supported by this command:
      ${keys.map((k) => inlineCode(k)).join(', ')}
      `)

    const paste = pasteAliases.get(command)!
    const pasteLink = await paste(content)

    if (!pasteLink) return Embed.error('A server error prevented me from uploading the paste. Try a different server!')

    return Embed.ok(pasteLink)
  }
}

import { InteractionSubCommand } from '#khaf/Interaction'
import { Board } from '#khaf/utility/commands/MineSweeper'
import { Embed } from '#khaf/utility/Constants/Embeds.mjs'
import type { InteractionReplyOptions } from 'discord.js'

export class kSubCommand implements InteractionSubCommand {
  data = {
    references: 'games',
    name: 'minesweeper'
  }

  async handle (): Promise<InteractionReplyOptions> {
    return {
      embeds: [
        Embed.ok(Board())
      ]
    }
  }
}

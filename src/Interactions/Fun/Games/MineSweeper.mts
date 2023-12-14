import type { InteractionReplyOptions } from 'discord.js'
import { InteractionSubCommand } from '#khaf/Interaction'
import { Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { Board } from '#khaf/utility/commands/MineSweeper'

export class kSubCommand extends InteractionSubCommand {
  constructor() {
    super({
      references: 'games',
      name: 'minesweeper'
    })
  }

  handle(): InteractionReplyOptions {
    return {
      embeds: [Embed.ok(Board())]
    }
  }
}

import { InteractionSubCommand } from '#khaf/Interaction'
import { type Difficulty, TicTacToe, type Turn } from '#khaf/utility/commands/TicTacToe'
import { Buttons, Components } from '#khaf/utility/Constants/Components.mjs'
import { minutes, seconds } from '#khaf/utility/ms.mjs'
import { chunkSafe } from '#khaf/utility/util.mjs'
import {
  type APIActionRowComponent,
  type APIButtonComponent,
  type APIMessageActionRowComponent,
  InteractionType
} from 'discord-api-types/v10'
import type { ButtonInteraction, ChatInputCommandInteraction } from 'discord.js'
import { InteractionCollector } from 'discord.js'
import { randomUUID } from 'node:crypto'

const makeRows = (turns: Turn[], id: string, ended = false): APIActionRowComponent<APIMessageActionRowComponent>[] => {
  const rows: APIButtonComponent[] = []

  for (let i = 0; i < turns.length; i++) {
    const row = turns[i]

    if (row === 'X' || row === 'O') {
      const style = row === 'X' ? 'approve' : 'primary'
      const button = Buttons[style](row, `${row},${i}-${id}`)
      button.disabled = true
      rows.push(button)
    } else {
      const button = Buttons.secondary('\u200b', `empty,${i}-${id}`)
      button.disabled = ended
      rows.push(button)
    }
  }

  return chunkSafe(rows, 3).map((r) => Components.actionRow(r))
}

export class kSubCommand extends InteractionSubCommand {
  constructor () {
    super({
      references: 'games',
      name: 'tictactoe'
    })
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<void> {
    const id = randomUUID()
    const difficulty = interaction.options.getString('difficulty') ?? 'easy'
    const game = new TicTacToe(difficulty as Difficulty)
    const int = await interaction.editReply({
      content: 'Tic-Tac-Toe',
      components: makeRows(game.board, id)
    })

    const collector = new InteractionCollector<ButtonInteraction>(interaction.client, {
      interactionType: InteractionType.MessageComponent,
      message: int,
      time: minutes(2),
      idle: seconds(30),
      max: 5,
      filter: (i) =>
        i.message.id === int.id
        && i.user.id === interaction.user.id
        && i.customId.endsWith(id)
    })

    for await (const [i] of collector) {
      const customId = i.customId.split('-')[0]
      const idx = customId.split(',')[1]
      game.go(Number(idx))
      game.botGo()

      let reason = 'Tic-Tac-Toe'

      if (game.winner()) {
        collector.stop('winner')
        reason = `Game over - ${game.turn} won!`
      } else if (game.isFull()) {
        collector.stop('tie')
        reason = 'Looks like it\'s a tie!'
      }

      await i.update({
        content: reason,
        components: makeRows(game.board, id, collector.ended)
      })
    }

    if (collector.endReason === 'time' || collector.endReason === 'idle') {
      await interaction.editReply({
        content: 'Game took too long, play a little faster next time!',
        components: makeRows(game.board, id, true)
      })
    }
  }
}

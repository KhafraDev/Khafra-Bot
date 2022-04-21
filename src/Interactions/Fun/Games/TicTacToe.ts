import { InteractionSubCommand } from '#khaf/Interaction';
import { chunkSafe } from '#khaf/utility/Array.js';
import { TicTacToe } from '#khaf/utility/commands/TicTacToe';
import { Buttons, Components } from '#khaf/utility/Constants/Components.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { inlineCode } from '@discordjs/builders';
import {
    InteractionType,
    type APIActionRowComponent, type APIButtonComponent, type APIMessageActionRowComponent
} from 'discord-api-types/v10';
import type { ChatInputCommandInteraction, InteractionReplyOptions, MessageComponentInteraction } from 'discord.js';
import { InteractionCollector } from 'discord.js';

type Board = ('X' | 'O' | null)[];

const makeRows = (turns: Board, ended = false): APIActionRowComponent<APIMessageActionRowComponent>[] => {
    const rows: APIButtonComponent[] = [];

    for (let i = 0; i < turns.length; i++) {
        const row = turns[i];

        if (row === 'X' || row === 'O') {
            const button = Buttons.approve(row, `${row},${i}`);
            button.disabled = true;
            rows.push(button);
        } else {
            const button = Buttons.secondary('\u200b', `empty,${i}`);
            button.disabled = ended;
            rows.push(button);
        }
    }

    return chunkSafe(rows, 3).map(r => Components.actionRow(r));
}

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'games',
            name: 'tictactoe'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | undefined> {
        const game = new TicTacToe();

        const [err, int] = await dontThrow(interaction.editReply({
            content: 'Tic-Tac-Toe',
            components: makeRows(game.board)
        }));

        if (err !== null) {
            return {
                content: `❌ An unexpected error occurred: ${inlineCode(err.message)}`,
                ephemeral: true
            }
        }

        const collector = new InteractionCollector<MessageComponentInteraction>(interaction.client, {
            interactionType: InteractionType.MessageComponent,
            message: int,
            time: 120_000,
            idle: 15_000,
            max: 5,
            filter: (i) =>
                i.message.id === int.id &&
                i.user.id === interaction.user.id
        });

        collector.on('collect', i => {
            const [, idx] = i.customId.split(',');
            game.go(Number(idx));
            game.botGo();

            let reason = 'Tic-Tac-Toe';

            if (game.winner()) {
                collector.stop('winner');
                reason = `Game over - ${game.turn} won!`;
            } else if (game.isFull()) {
                collector.stop('tie');
                reason = 'Looks like it\'s a tie!';
            }

            return void dontThrow(i.update({
                content: reason,
                components: makeRows(game.board, collector.ended)
            }));
        });

        collector.once('end', (_, r) => {
            if (r === 'time' || r === 'idle') {
                return void dontThrow(interaction.editReply({
                    content: 'Game took too long, play a little faster next time!',
                    components: makeRows(game.board, true)
                }));
            }
        });
    }
}
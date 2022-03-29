import { InteractionSubCommand } from '#khaf/Interaction';
import { chunkSafe } from '#khaf/utility/Array.js';
import { TicTacToe } from '#khaf/utility/commands/TicTacToe';
import { Components } from '#khaf/utility/Constants/Components.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { ActionRow, ButtonComponent, inlineCode, MessageActionRowComponent } from '@discordjs/builders';
import { InteractionType } from 'discord-api-types/v10';
import { ChatInputCommandInteraction, InteractionCollector, InteractionReplyOptions, MessageComponentInteraction } from 'discord.js';

type Board = ('X' | 'O' | null)[];

const makeRows = (turns: Board, ended = false): ActionRow<MessageActionRowComponent>[] => {
    const rows: ButtonComponent[] = [];

    for (let i = 0; i < turns.length; i++) {
        const row = turns[i];

        if (row === 'X') {
            rows.push(Components.approve('X', `X,${i}`).setDisabled(true));
        } else if (row === 'O') {
            rows.push(Components.primary('O', `O,${i}`).setDisabled(true));
        } else {
            rows.push(Components.secondary('\u200b', `empty,${i}`).setDisabled(ended));
        }
    }

    return chunkSafe(rows, 3).map(r =>
        new ActionRow<MessageActionRowComponent>().addComponents(...r)
    );
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
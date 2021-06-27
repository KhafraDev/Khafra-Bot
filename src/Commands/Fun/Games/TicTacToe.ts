import { Message, MessageActionRow, MessageButton } from 'discord.js';
import { TicTacToe } from '../../../lib/Packages/TicTacToe.js';
import { chunkSafe } from '../../../lib/Utility/Array.js';
import { Components, disableAll } from '../../../lib/Utility/Constants/Components.js';
import { Command } from '../../../Structures/Command.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

type Board = ('X' | 'O' | null)[];

const makeRows = (turns: Board) => {
    const rows: MessageButton[] = [];

    for (let i = 0; i < turns.length; i++) {
        const row = turns[i];
        if (row === 'X')
            rows.push(Components.approve('X', 'X'));
        else if (row === 'O')
            rows.push(Components.primary('O', 'O'));
        else 
            rows.push(Components.secondary('\u200b', `empty,${i}`));
    }

    return chunkSafe(rows, 3).map(r => new MessageActionRow().addComponents(r))
}

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Play a game of Tic-Tac-Toe!'
            ],
			{
                name: 'tictactoe',
                folder: 'Games',
                args: [0, 1],
                ratelimit: 1
            }
        );
    }

    async init(message: Message) {
        const game = new TicTacToe();

        const m = await message.channel.send({
            content: 'Tic-Tac-Toe',
            components: makeRows(game.board)
        });

        const c = m.createMessageComponentInteractionCollector({
            filter: interaction => 
                interaction.message.id === m.id &&
                interaction.user.id === message.author.id &&
                /^empty,\d$/.test(interaction.customID),
            time: 120_000, 
            idle: 15_000, 
            max: 5
        });

        c.on('collect', i => {
            const [, idx] = i.customID.split(',');
            game.go(Number(idx));
            game.botGo();

            if (game.winner()) {
                c.stop();
                return void i.update({ 
                    content: `Game over - ${game.turn} won!`,
                    components: disableAll({
                        components: makeRows(game.board)
                    })
                });
            } else if (game.isFull()) {
                c.stop();
                return void i.update({ 
                    content: `Looks like it's a tie!`,
                    components: disableAll({
                        components: makeRows(game.board)
                    })
                });
            }

            return void i.update({ components: makeRows(game.board) });
        });

        c.on('end', (_c, r) => {
            if (r === 'time') {
                return void m.edit({
                    content: `Game took too long, play a little faster next time!`,
                    components: disableAll(m)
                });
            }
        });
    }
}
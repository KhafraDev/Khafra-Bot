import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import { TicTacToe } from "../../Backend/CommandStructures/TicTacToeHandler";
import Embed from "../../Structures/Embed";

export default class extends Command {
    constructor() {
        super(
            'tictactoe',
            [
                'Play a game of Tic-Tac-Toe in Discord.',
                ''
            ],
            [ /* No extra perms needed */ ],
            10
        );
    }

    async init(message: Message) {
        const game = new TicTacToe();

        const embed = Embed.success(`\`\`\`${game.formatBoard()}\`\`\``);
        const sent = await message.channel.send(embed);

        const filter = (m: Message) => m.author.id === message.author.id && Number(m.content) > 0 && Number(m.content) < 10;
        const collector = message.channel.createMessageCollector(filter, { 
            max: 5,
            time: 60000 
        });

        collector.on('collect', (m: Message) => {
            const user = game.go(Number(m.content) - 1);

            if(user === 2) { // user won the game
                const embed = Embed.success(`\`\`\`${game.formatBoard()}\`\`\``)
                    .setTitle('Player ' + game.state.turn + ' won!');

                collector.stop();
                return sent.edit(embed);
            } else if(user === 0) { // spot is already taken
                const embed = Embed.fail(`\`\`\`${game.formatBoard()}\`\`\``)
                    .setTitle('Spot is already taken!');

                return sent.edit(embed);
            }

            const auto = game.bestTurn();
            if(auto === 3) { // draw
                const embed = Embed.success(`\`\`\`${game.formatBoard()}\`\`\``)
                    .setTitle('It\'s a draw!');

                collector.stop();
                return sent.edit(embed);
            } else if(auto === 2) { // game is over
                const embed = Embed.success(`\`\`\`${game.formatBoard()}\`\`\``)
                    .setTitle('Player ' + game.state.turn + ' won!');

                collector.stop();
                return sent.edit(embed);
            } else if(auto === 0) { // still user's turn
                const embed = Embed.fail(`\`\`\`${game.formatBoard()}\`\`\``)
                    .setTitle('Spot is already taken!');
                    
                return sent.edit(embed);
            }

            const edit_embed = Embed.success(`\`\`\`${game.formatBoard()}\`\`\``);
            sent.edit(edit_embed);
        });
    }
}
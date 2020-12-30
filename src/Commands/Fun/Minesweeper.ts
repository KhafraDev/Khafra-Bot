import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { Board } from '../../lib/Backend/MineSweeper.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Play a game of MineSweeper!',
                ''
            ],
			{
                name: 'minesweeper',
                folder: 'Fun',
                args: [0, 0]
            }
        );
    }

    init(message: Message) {
        const board = Board();
        return message.reply(this.Embed.success(board));
    }
}
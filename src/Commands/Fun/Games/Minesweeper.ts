import { Command } from '../../../Structures/Command.js';
import { Board } from '../../../lib/Backend/MineSweeper.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Play a game of MineSweeper!'
            ],
			{
                name: 'minesweeper',
                folder: 'Games',
                args: [0, 0],
                // although being lightweight, games should take >30 seconds
                ratelimit: 30, 
                aliases: ['ms']
            }
        );
    }

    init() {
        return this.Embed.success(Board());
    }
}
import { Command } from '../../../Structures/Command.js';
import { Board } from '../../../lib/Packages/MineSweeper.js';

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

    async init() {
        return this.Embed.ok(Board());
    }
}
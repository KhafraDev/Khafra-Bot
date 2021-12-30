import { InteractionSubCommand } from '#khaf/Interaction';
import { Board } from '#khaf/utility/commands/MineSweeper';
import { Embed } from '#khaf/utility/Constants/Embeds.js';

export class kSubCommand extends InteractionSubCommand {
    constructor() {
        super({
            references: 'games',
            name: 'minesweeper'
        });
    }

    async handle () {
        return Embed.ok(Board());
    }
} 
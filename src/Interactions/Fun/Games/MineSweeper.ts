import { InteractionSubCommand } from '#khaf/Interaction';
import { Board } from '#khaf/utility/commands/MineSweeper';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { type UnsafeEmbed as MessageEmbed } from '@discordjs/builders';

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'games',
            name: 'minesweeper'
        });
    }

    async handle (): Promise<MessageEmbed> {
        return Embed.ok(Board());
    }
}
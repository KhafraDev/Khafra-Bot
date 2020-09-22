import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import { Board } from "../../lib/Backend/MineSweeper";

export default class extends Command {
    constructor() {
        super(
            [
                'Play a game of MineSweeper!',
                ''
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'minesweeper',
                folder: 'Fun',
                args: [0, 0]
            }
        );
    }

    init(message: Message) {
        const board = Board();
        return message.channel.send(this.Embed.success(board));
    }
}
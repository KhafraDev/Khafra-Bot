import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import { Board } from "../../lib/Backend/MineSweeper";
import Embed from "../../Structures/Embed";

export default class extends Command {
    constructor() {
        super(
            { name: 'minesweeper', folder: 'fun' },
            [
                'Play a game of MineSweeper!',
                ''
            ],
            [ /* No extra perms needed */ ],
            10
        );
    }

    init(message: Message) {
        const board = Board();
        return message.channel.send(Embed.success(board));
    }
}
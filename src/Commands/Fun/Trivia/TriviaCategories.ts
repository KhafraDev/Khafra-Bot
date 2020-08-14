import { Command } from "../../../Structures/Command";
import { Message } from "discord.js";
import { trivia } from "../../../lib/Backend/Trivia";
import Embed from "../../../Structures/Embed";

export default class extends Command {
    constructor() {
        super(
            { name: 'trivialist', folder: 'Trivia' },
            [
                'Trivia: list the trivia categories you can choose from.',
                ''
            ],
            [ /* No extra perms needed */ ],
            10,
            [ 'triviacategory', 'triviacategories' ]
        );
    }

    async init(message: Message) {
        const list = await trivia.fetchList();
        if(list) {
            const embed = Embed.success()
                .setTitle('Trivia Categories')
                .setDescription(`${list.trivia_categories.map(a => `\`\`${a.id}\`\`: ${a.name}`).join('\n')}`)

            return message.channel.send(embed);
        }
    }
}
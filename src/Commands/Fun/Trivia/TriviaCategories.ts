import { Command } from "../../../Structures/Command";
import { Message } from "discord.js";
import { trivia } from "../../../lib/Backend/Trivia/Trivia";

export default class extends Command {
    constructor() {
        super(
            [
                'Trivia: list the trivia categories you can choose from.',
                ''
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'trivialist',
                folder: 'Trivia',
                aliases: [ 'triviacategory', 'triviacategories' ],
                args: [0, 0]
            }
        );
    }

    async init(message: Message) {
        const list = await trivia.fetchList();
        if(list) {
            const embed = this.Embed.success()
                .setTitle('Trivia Categories')
                .setDescription(`${list.trivia_categories.map(a => `\`\`${a.id}\`\`: ${a.name}`).join('\n')}`)

            return message.channel.send(embed);
        } else {
            return message.channel.send(this.Embed.fail('An unexpected error occurred!'));
        }
    }
}
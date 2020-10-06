import { Command } from "../../../Structures/Command";
import { Message } from "discord.js";
import { Trivia, categories } from "../../../lib/Backend/Trivia/Trivia";

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
        const list = categories.length > 0 ? categories : await Trivia.fetchList();
        if(list) {
            const embed = this.Embed.success()
                .setTitle('Trivia Categories')
                .setDescription(`${list.map(a => `\`\`${a.id}\`\`: ${a.name}`).join('\n')}`)

            return message.channel.send(embed);
        } else {
            return message.channel.send(this.Embed.fail('An unexpected error occurred!'));
        }
    }
}
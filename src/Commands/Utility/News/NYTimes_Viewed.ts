import { Command } from "../../../Structures/Command";
import { Message } from "discord.js";
import { nytimes } from "../../../lib/Backend/NYTimes/NYTimes";
import { ViewedArticle } from "../../../lib/Backend/NYTimes/types/NYTimes";
import Embed from "../../../Structures/Embed";

export default class extends Command {
    constructor() {
        super(
            [
                'NYTimes: get the most viewed articles from today.',
                ''
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'nytimes',
                folder: 'News',
                args: [0, 0]
            }
        );
    }

    async init(message: Message) {
        let res: ViewedArticle;
        try {
            res = await nytimes.viewed();
        } catch {
            return message.channel.send(Embed.fail('An unexpected error occurred!'));
        }

        const description: string[] = [];
        for(const article of res.results) {
            const line = `[${article.title}](${article.url})\n`;
            if(description.reduce((a, b) => a + b.length, 0) + line.length <= 2048) {
                description.push(line);
            } else {
                break;
            }
        }

        const embed = Embed.success()
            .setFooter(res.copyright)
            .setDescription(description.join(''))
            .setTitle(`Top ${description.length} articles today!`);

        return message.channel.send(embed);
    }
}
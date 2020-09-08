import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import { Kongregate } from "../../lib/Backend/SynergismStats";
import Embed from "../../Structures/Embed";

export default class extends Command {
    constructor() {
        super(
            [
                'Get play stats about Synergism!',
                ''
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'synergismstats',
                folder: 'Fun',
                args: [0, 0],
                aliases: [ 'synergismstat' ]
            }
        );
    }

    async init(message: Message) {
        const stats = await Kongregate();
        if('status' in stats) {
            return message.channel.send(Embed.fail(`Received status ${stats.status} (${stats.statusText})!`));
        }

        const [, average,, ratings] = stats.average_rating_with_count.split(/\s+/g);
        const embed = Embed.success()
            .setTitle('Synergism Stats (Kongregate)')
            .setDescription(`
            **Plays:**: ${stats.gameplays_count.toLocaleString()}
            **Favorites:** ${stats.favorites_count.toLocaleString()}
            Synergism averages **${average}**/5 ⭐ from **${ratings}** ratings! 
            `);

        return message.channel.send(embed);
    }
}
import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { Kongregate } from '../../lib/Backend/SynergismStats.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Get play stats about Synergism!',
                ''
            ],
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
            return message.reply(this.Embed.fail(`Received status ${stats.status} (${stats.statusText})!`));
        }

        const [, average,, ratings] = stats.average_rating_with_count.split(/\s+/g);
        const embed = this.Embed.success()
            .setTitle('Synergism Stats (Kongregate)')
            .setDescription(`
            **Plays:**: ${stats.gameplays_count.toLocaleString()}
            **Favorites:** ${stats.favorites_count.toLocaleString()}
            Synergism averages **${average}**/5 ⭐ from **${ratings}** ratings! 
            `);

        return message.reply(embed);
    }
}
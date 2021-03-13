import { Command } from '../../Structures/Command.js';
import { Kongregate } from '../../lib/Backend/SynergismStats.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get play stats about Synergism!'
            ],
			{
                name: 'synergismstats',
                folder: 'Fun',
                args: [0, 0],
                aliases: [ 'synergismstat' ]
            }
        );
    }

    async init() {
        const stats = await Kongregate();

        const [, average,, ratings] = stats.average_rating_with_count.split(/\s+/g);
        return this.Embed.success()
            .setTitle('Synergism Stats (Kongregate)')
            .setDescription(`
            **Plays:**: ${stats.gameplays_count.toLocaleString()}
            **Favorites:** ${stats.favorites_count.toLocaleString()}
            Synergism averages **${average}**/5 ⭐ from **${ratings}** ratings! 
            `);
    }
}
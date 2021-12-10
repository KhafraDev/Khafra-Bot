import { Command } from '../../Structures/Command.js';
import { Kongregate } from '../../lib/Packages/SynergismStats.js';
import { request } from 'undici';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';
import { bold, inlineCode } from '@khaf/builders';

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
        const [err, quarkBonus] = await dontThrow(request('https://synergism-quarks.khafra.workers.dev/'));

        if (stats === null) {
            return this.Embed.error('Failed to fetch the stats!');
        } else if (err !== null) {
            return this.Embed.error(`An unexpected error occurred: ${inlineCode(err.message)}.`);
        }

        const quarks = await quarkBonus.body.json() as { bonus: number };
        const [, average,, ratings] = stats.average_rating_with_count.split(/\s+/g);
        return this.Embed.ok()
            .setTitle('Synergism Stats (Kongregate)')
            .setDescription(`
            ${bold('Plays')}: ${stats.gameplays_count.toLocaleString()}
            ${bold('Favorites')}: ${stats.favorites_count.toLocaleString()}
            Synergism averages ${bold(average)}/5 ⭐ from ${bold(ratings)} ratings! 
            `)
            .addField(bold('Quark Bonus:'), `${quarks.bonus}%`, true);
    }
}
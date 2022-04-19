import { Command } from '#khaf/Command';
import { Kongregate } from '#khaf/utility/commands/SynergismStats';
import { Embed, EmbedUtil } from '#khaf/utility/Constants/Embeds.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { bold, inlineCode } from '@discordjs/builders';
import type { APIEmbed } from 'discord-api-types/v10';
import { request } from 'undici';

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Get play stats about Synergism!'
            ],
            {
                name: 'synergismstats',
                folder: 'Fun',
                args: [0, 0],
                aliases: ['synergismstat']
            }
        );
    }

    async init (): Promise<APIEmbed> {
        const stats = await Kongregate();
        const [err, quarkBonus] = await dontThrow(request('https://synergism-quarks.khafra.workers.dev/'));

        if (stats === null) {
            return Embed.error('Failed to fetch the stats!');
        } else if (err !== null) {
            return Embed.error(`An unexpected error occurred: ${inlineCode(err.message)}.`);
        }

        const quarks = await quarkBonus.body.json() as { bonus: number };
        const [, average,, ratings] = stats.average_rating_with_count.split(/\s+/g);
        const embed = Embed.ok();
        EmbedUtil.setTitle(embed, 'Synergism Stats (Kongregate)');
        EmbedUtil.setDescription(embed, `
        ${bold('Plays')}: ${stats.gameplays_count.toLocaleString()}
        ${bold('Favorites')}: ${stats.favorites_count.toLocaleString()}
        Synergism averages ${bold(average)}/5 ⭐ from ${bold(ratings)} ratings! 
        `);
        EmbedUtil.addField(
            embed,
            {
                name: bold('Quark Bonus:'),
                value: `${quarks.bonus}%`,
                inline: true
            }
        );

        return embed;
    }
}
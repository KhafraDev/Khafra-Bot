import type { Arguments} from '#khaf/Command';
import { Command } from '#khaf/Command';
import { searchTV } from '#khaf/utility/commands/TMDB';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { isDM, isText } from '#khaf/utility/Discord.js';
import { bold, time, type UnsafeEmbedBuilder } from '@discordjs/builders';
import type { Message } from 'discord.js';

export class kCommand extends Command {
    constructor () {
        super([
            'Get information about a tv show!'
        ], {
            name: 'tv',
            folder: 'Utility',
            args: [0],
            aliases: ['tele', 'television']
        });
    }

    async init (message: Message, { content }: Arguments): Promise<UnsafeEmbedBuilder | string> {
        const tv = await searchTV(
            content,
            isDM(message.channel) || (isText(message.channel) && message.channel.nsfw)
        );

        if (!tv)
            return '❌ No TV show with that name was found!';

        const embed = Embed.ok()
            .setTitle(tv.name)
            .setDescription(tv.overview)
            .addFields(
                { name: bold('Genres:'), value: tv.genres.map(g => g.name).join(', '), inline: true },
                { name: bold('Status:'), value: tv.status, inline: true },
                {
                    name: bold('Premiered:'),
                    value: tv.first_air_date ? time(new Date(tv.first_air_date), 'D') : 'Unknown',
                    inline: true
                },
                { name: bold('Seasons:'), value: `${tv.number_of_seasons}`, inline: true },
                { name: bold('Episodes:'), value: `${tv.number_of_episodes}`, inline: true },
                { name: bold('TMDB:'), value: `[TMDB](https://www.themoviedb.org/tv/${tv.id})`, inline: true }
            )
            .setFooter({ text: 'Data provided by https://www.themoviedb.org/' })

        tv.homepage && embed.setURL(tv.homepage);

        if (tv.poster_path)
            embed.setImage(`https://image.tmdb.org/t/p/original${tv.poster_path}`);
        else if (tv.backdrop_path)
            embed.setImage(`https://image.tmdb.org/t/p/original${tv.backdrop_path}`);

        return embed;
    }
}
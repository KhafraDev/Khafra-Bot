import { Arguments, Command } from '#khaf/Command';
import { searchMovie } from '#khaf/utility/commands/TMDB';
import { isDM, isText } from '#khaf/utility/Discord.js';
import { time, type Embed } from '@khaf/builders';
import { Message } from 'discord.js';

const formatMS = (ms: number): string => Object.entries({
    d: Math.floor(ms / 86400000),
    h: Math.floor(ms / 3600000) % 24,
    m: Math.floor(ms / 60000) % 60,
    s: Math.floor(ms / 1000) % 60,
})
    .filter(f => f[1] > 0)
    .map(t => `${t[1]}${t[0]}`)
    .join(' ');

export class kCommand extends Command {
    constructor () {
        super([
            'Get information about a movie!'
        ], {
            name: 'movies',
            folder: 'Utility',
            args: [0],
            aliases: ['movie', 'tmdb']
        });
    }

    async init (message: Message, { args }: Arguments): Promise<Embed> {
        const movies = await searchMovie(
            args.join(' '), 
            isDM(message.channel) || (isText(message.channel) && message.channel.nsfw)
        );
        
        if (!movies)
            return this.Embed.error('No movies found!');

        const embed = this.Embed.ok()
            .setTitle(movies.original_title ?? movies.title)
            .setDescription(movies.overview ?? '')
            .addFields(
                { name: '**Genres:**', value: movies.genres.map(g => g.name).join(', '), inline: true },
                { name: '**Runtime:**', value: formatMS(Number(movies.runtime) * 60000), inline: true },
                { name: '**Status:**', value: movies.status, inline: true },
                {
                    name: '**Released:**',
                    value: movies.release_date ? time(new Date(movies.release_date)) : 'Unknown',
                    inline: true
                },
                { name: '**TMDB:**', value: `[TMDB](https://www.themoviedb.org/movie/${movies.id})`, inline: true }
            )
            .setFooter({ text: 'Data provided by https://www.themoviedb.org/' })
            
        movies.homepage && embed.setURL(movies.homepage);
        movies.imdb_id && embed.addField({
            name: '**IMDB:**',
            value: `[IMDB](https://www.imdb.com/title/${movies.imdb_id}/)`,
            inline: true
        });
        
        if (movies.poster_path) 
            embed.setImage(`https://image.tmdb.org/t/p/original${movies.poster_path}`);
        else if (movies.backdrop_path)
            embed.setImage(`https://image.tmdb.org/t/p/original${movies.backdrop_path}`);

        return embed;
    }
}
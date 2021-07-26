import { Message } from 'discord.js';
import { searchMovie } from '../../lib/Packages/TMDB.js';
import { isDM, isText } from '../../lib/types/Discord.js.js';
import { Command, Arguments } from '../../Structures/Command.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { time } from '@discordjs/builders';

const formatMS = (ms: number) => {
    return Object.entries({
		d: Math.floor(ms / 86400000),
		h: Math.floor(ms / 3600000) % 24,
		m: Math.floor(ms / 60000) % 60,
		s: Math.floor(ms / 1000) % 60,
    })
        .filter(f => f[1] > 0)
        .map(t => `${t[1]}${t[0]}`)
        .join(' ');
}

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super([
            'Get information about a movie!'
        ], {
            name: 'movies',
            folder: 'Utility',
            args: [0],
            aliases: ['movie', 'tmdb']
        });
    }

    async init(message: Message, { args }: Arguments) {
        const movies = await searchMovie(
            args.join(' '), 
            isDM(message.channel) || (isText(message.channel) && message.channel.nsfw)
        );
        
        if (!movies)
            return this.Embed.fail('No movies found!');

        const embed = this.Embed.success()
            .setTitle(movies.original_title ?? movies.title)
            .setDescription(movies.overview ?? '')
            .addField('**Genres:**', movies.genres.map(g => g.name).join(', '), true)
            .addField('**Runtime:**', formatMS(Number(movies.runtime) * 60000), true)
            .addField('**Status:**', movies.status, true)
            .addField('**Released:**', movies.release_date ? time(new Date(movies.release_date)) : 'Unknown', true)
            .addField('**TMDB:**', `[TMDB](https://www.themoviedb.org/movie/${movies.id})`, true)
            .setFooter('Data provided by https://www.themoviedb.org/')
            
            movies.homepage && embed.setURL(movies.homepage);
            movies.imdb_id && embed.addField('**IMDB:**', `[IMDB](https://www.imdb.com/title/${movies.imdb_id}/)`, true);
        if (movies.poster_path) 
            embed.setImage(`https://image.tmdb.org/t/p/original${movies.poster_path}`);
        else if (movies.backdrop_path)
            embed.setImage(`https://image.tmdb.org/t/p/original${movies.backdrop_path}`);

        return embed;
    }
}
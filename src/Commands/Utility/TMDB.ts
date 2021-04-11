import { Message } from 'discord.js';
import { searchMovie } from '../../lib/Backend/TMDB.js';
import { isDM } from '../../lib/types/Discord.js.js';
import { formatDate } from '../../lib/Utility/Date.js';
import { Command, Arguments } from '../../Structures/Command.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

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
            'en-US', 
            isDM(message.channel) || message.channel.nsfw
        );
        
        if (!movies)
            return this.Embed.fail('No movies found!');

        const { details } = movies;

        const embed = this.Embed.success()
            .setTitle(details.original_title ?? details.title)
            .setDescription(details.overview)
            .addField('**Genres:**', details.genres.map(g => g.name).join(', '), true)
            .addField('**Uptime:**', formatMS(details.runtime * 60000), true)
            .addField('**Released:**', details.release_date ? formatDate('MMMM Do, YYYY hh:mm:ssA', details.release_date) : 'Unknown', true)
            .addField('**TMDB:**', `https://www.themoviedb.org/movie/${details.id}`, true)
            .setFooter('Data provided by https://www.themoviedb.org/')
            
        details.homepage && embed.setURL(details.homepage);
        details.imdb_id && embed.addField('**IMDB:**', `https://www.imdb.com/title/${details.imdb_id}/`, true);
        if (details.poster_path) 
            embed.setImage(`https://image.tmdb.org/t/p/original${details.poster_path}`);
        else if (details.backdrop_path)
            embed.setImage(`https://image.tmdb.org/t/p/original${details.backdrop_path}`);

        return embed;
    }
}
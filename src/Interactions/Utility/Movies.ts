import { ChatInputCommandInteraction } from 'discord.js';
import { Interactions } from '#khaf/Interaction';
import { bold, time } from '@khaf/builders';
import { searchMovie } from '#khaf/utility/commands/TMDB';
import { isDM, isText } from '#khaf/utility/Discord.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';

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

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'movie',
            description: 'Gets information about a movie!',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'name',
                    description: 'The movie\'s name.',
                    required: true
                }
            ]
        };

        super(sc, { defer: true });
    }

    async init(interaction: ChatInputCommandInteraction) {
        const movies = await searchMovie(
            interaction.options.getString('name', true),
            isDM(interaction.channel) || (isText(interaction.channel) && interaction.channel.nsfw)
        );
        
        if (!movies)
            return '❌ No movie with that name was found!';

        const embed = Embed.ok()
            .setTitle(movies.original_title ?? movies.title)
            .setDescription(movies.overview ?? '')
            .addField(bold('Genres:'), movies.genres.map(g => g.name).join(', '), true)
            .addField(bold('Runtime:'), formatMS(Number(movies.runtime) * 60000), true)
            .addField(bold('Status:'), movies.status, true)
            .addField(bold('Released:'), movies.release_date ? time(new Date(movies.release_date)) : 'Unknown', true)
            .addField(bold('TMDB:'), `[TMDB](https://www.themoviedb.org/movie/${movies.id})`, true)
            .setFooter({ text: 'Data provided by https://www.themoviedb.org/' })
            
        movies.homepage && embed.setURL(movies.homepage);
        movies.imdb_id && embed.addField(bold('IMDB:'), `[IMDB](https://www.imdb.com/title/${movies.imdb_id}/)`, true);
        
        if (movies.poster_path) 
            embed.setImage(`https://image.tmdb.org/t/p/original${movies.poster_path}`);
        else if (movies.backdrop_path)
            embed.setImage(`https://image.tmdb.org/t/p/original${movies.backdrop_path}`);

        return embed;
    }
} 
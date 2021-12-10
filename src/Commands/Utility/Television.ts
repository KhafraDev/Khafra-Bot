import { Message } from 'discord.js';
import { searchTV } from '../../lib/Packages/TMDB.js';
import { isDM, isText } from '../../lib/types/Discord.js.js';
import { Command, Arguments } from '../../Structures/Command.js';
import { bold, time } from '@khaf/builders';

export class kCommand extends Command {
    constructor() {
        super([
            'Get information about a tv show!'
        ], {
            name: 'tv',
            folder: 'Utility',
            args: [0],
            aliases: ['tele', 'television']
        });
    }

    async init(message: Message, { args }: Arguments) {
        const tv = await searchTV(
            args.join(' '), 
            isDM(message.channel) || (isText(message.channel) && message.channel.nsfw)
        );
        
        if (!tv)
            return this.Embed.error('No tv shows found!');

        const embed = this.Embed.ok()
            .setTitle(tv.name)
            .setDescription(tv.overview)
            .addField(bold('Genres:'), tv.genres.map(g => g.name).join(', '), true)
            .addField(bold('Status:'), tv.status, true)
            .addField(bold('Premiered:'), tv.first_air_date ? time(new Date(tv.first_air_date), 'D') : 'Unknown', true)
            .addField(bold('Seasons:'), `${tv.number_of_seasons}`, true)
            .addField(bold('Episodes:'), `${tv.number_of_episodes}`, true)
            .addField(bold('TMDB:'), `[TMDB](https://www.themoviedb.org/tv/${tv.id})`, true)
            .setFooter('Data provided by https://www.themoviedb.org/')
            
        tv.homepage && embed.setURL(tv.homepage);
        if (tv.poster_path) 
            embed.setImage(`https://image.tmdb.org/t/p/original${tv.poster_path}`);
        else if (tv.backdrop_path)
            embed.setImage(`https://image.tmdb.org/t/p/original${tv.backdrop_path}`);

        return embed;
    }
}
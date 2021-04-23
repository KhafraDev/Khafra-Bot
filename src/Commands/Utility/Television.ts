import { Message } from 'discord.js';
import { searchTV } from '../../lib/Backend/TMDB.js';
import { isDM } from '../../lib/types/Discord.js.js';
import { formatDate } from '../../lib/Utility/Date.js';
import { Command, Arguments } from '../../Structures/Command.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
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
            isDM(message.channel) || message.channel.nsfw
        );
        
        if (!tv)
            return this.Embed.fail('No tv shows found!');

        const embed = this.Embed.success()
            .setTitle(tv.name)
            .setDescription(tv.overview)
            .addField('**Genres:**', tv.genres.map(g => g.name).join(', '), true)
            .addField('**Status:**', tv.status, true)
            .addField('**Premiered:**', tv.first_air_date ? formatDate('MMMM Do, YYYY', tv.first_air_date) : 'Unknown', true)
            .addField('**Seasons:**', tv.number_of_seasons, true)
            .addField('**Episodes:**', tv.number_of_episodes, true)
            .addField('**TMDB:**', `[TMDB](https://www.themoviedb.org/tv/${tv.id})`, true)
            .setFooter('Data provided by https://www.themoviedb.org/')
            
        tv.homepage && embed.setURL(tv.homepage);
        if (tv.poster_path) 
            embed.setImage(`https://image.tmdb.org/t/p/original${tv.poster_path}`);
        else if (tv.backdrop_path)
            embed.setImage(`https://image.tmdb.org/t/p/original${tv.backdrop_path}`);

        return embed;
    }
}
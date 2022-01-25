import { ChatInputCommandInteraction } from 'discord.js';
import { Interactions } from '#khaf/Interaction';
import { bold, time } from '@khaf/builders';
import { searchTV } from '#khaf/utility/commands/TMDB';
import { isDM, isText } from '#khaf/utility/Discord.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'tv',
            description: 'Gets information about a TV show!',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'name',
                    description: 'TV show to get information about.',
                    required: true
                }
            ]
        };

        super(sc, { defer: true });
    }

    async init(interaction: ChatInputCommandInteraction) {
        const tv = await searchTV(
            interaction.options.getString('name', true),
            isDM(interaction.channel) || (isText(interaction.channel) && interaction.channel.nsfw)
        );
        
        if (!tv)
            return `❌ No TV show with that name was found!`;

        const embed = Embed.ok()
            .setTitle(tv.name)
            .setDescription(tv.overview)
            .addField({ name: bold('Genres:'), value: tv.genres.map(g => g.name).join(', '), inline: true })
            .addField({ name: bold('Status:'), value: tv.status, inline: true })
            .addField({
                name: bold('Premiered:'),
                value: tv.first_air_date ? time(new Date(tv.first_air_date), 'D') : 'Unknown',
                inline: true
            })
            .addField({ name: bold('Seasons:'), value: `${tv.number_of_seasons}`, inline: true })
            .addField({ name: bold('Episodes:'), value: `${tv.number_of_episodes}`, inline: true })
            .addField({ name: bold('TMDB:'), value: `[TMDB](https://www.themoviedb.org/tv/${tv.id})`, inline: true })
            .setFooter({ text: 'Data provided by https://www.themoviedb.org/' })
            
        tv.homepage && embed.setURL(tv.homepage);
        
        if (tv.poster_path) 
            embed.setImage(`https://image.tmdb.org/t/p/original${tv.poster_path}`);
        else if (tv.backdrop_path)
            embed.setImage(`https://image.tmdb.org/t/p/original${tv.backdrop_path}`);

        return embed;
    }
} 
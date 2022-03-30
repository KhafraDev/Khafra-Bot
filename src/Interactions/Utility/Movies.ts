import { Interactions } from '#khaf/Interaction';
import { searchMovie } from '#khaf/utility/commands/TMDB';
import { Components } from '#khaf/utility/Constants/Components.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { isDM, isText } from '#khaf/utility/Discord.js';
import type { MessageActionRowComponent} from '@discordjs/builders';
import { ActionRow, bold, hyperlink, time } from '@discordjs/builders';
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ApplicationCommandOptionType } from 'discord-api-types/v10';
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';

const formatMS = (ms: number): string => {
    return Object.entries({
        d: Math.floor(ms / 86400000),
        h: Math.floor(ms / 3600000) % 24,
        m: Math.floor(ms / 60000) % 60,
        s: Math.floor(ms / 1000) % 60
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

    async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const movies = await searchMovie(
            interaction.options.getString('name', true),
            isDM(interaction.channel) || (isText(interaction.channel) && interaction.channel.nsfw)
        );

        if (!movies) {
            return {
                content: '❌ No movie with that name was found!',
                ephemeral: true
            }
        }

        const components: ActionRow<MessageActionRowComponent>[] = [];
        const embed = Embed.ok()
            .setTitle(movies.original_title ?? movies.title)
            .setDescription(movies.overview ?? '')
            .addFields(
                {
                    name: bold('Genres:'),
                    value: movies.genres.map(g => g.name).join(', '),
                    inline: true
                },
                { name: bold('Runtime:'), value: formatMS(Number(movies.runtime) * 60000), inline: true },
                { name: bold('Status:'), value: movies.status, inline: true },
                {
                    name: bold('Released:'),
                    value: movies.release_date ? time(new Date(movies.release_date)) : 'Unknown',
                    inline: true
                },
                {
                    name: bold('TMDB:'),
                    value: `[TMDB](https://www.themoviedb.org/movie/${movies.id})`,
                    inline: true
                }
            )
            .setFooter({ text: 'Data provided by https://www.themoviedb.org/' });

        if (movies.homepage) {
            embed.setURL(movies.homepage);
        }

        if (movies.imdb_id) {
            const link = `https://www.imdb.com/title/${movies.imdb_id}/`;
            embed.addFields({ name: bold('IMDB:'), value: hyperlink('IMDB', link), inline: true });

            components.push(
                new ActionRow<MessageActionRowComponent>().addComponents(
                    Components.link('Go to IMDB', link)
                )
            );
        }

        if (movies.poster_path) {
            embed.setImage(`https://image.tmdb.org/t/p/original${movies.poster_path}`);
        } else if (movies.backdrop_path) {
            embed.setImage(`https://image.tmdb.org/t/p/original${movies.backdrop_path}`);
        }

        return {
            embeds: [embed],
            components
        }
    }
}
import { Interactions } from '#khaf/Interaction';
import { searchTV } from '#khaf/utility/commands/TMDB';
import { Components } from '#khaf/utility/Constants/Components.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { isDM, isText } from '#khaf/utility/Discord.js';
import { ActionRow, bold, hyperlink, MessageActionRowComponent, time } from '@discordjs/builders';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';

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

    async init(interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const tv = await searchTV(
            interaction.options.getString('name', true),
            isDM(interaction.channel) || (isText(interaction.channel) && interaction.channel.nsfw)
        );

        if (!tv) {
            return {
                content: '❌ No TV show with that name was found!',
                ephemeral: true
            }
        }

        const link = `https://www.themoviedb.org/tv/${tv.id})`;
        const embed = Embed.ok()
            .setTitle(tv.name)
            .setDescription(tv.overview)
            .setFooter({ text: 'Data provided by https://www.themoviedb.org/' })
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
                { name: bold('TMDB:'), value: hyperlink('TMDB', link), inline: true }
            );

        if (tv.homepage) {
            embed.setURL(tv.homepage);
        }

        if (tv.poster_path) {
            embed.setImage(`https://image.tmdb.org/t/p/original${tv.poster_path}`);
        } else if (tv.backdrop_path) {
            embed.setImage(`https://image.tmdb.org/t/p/original${tv.backdrop_path}`);
        }

        return {
            embeds: [embed],
            components: [
                new ActionRow<MessageActionRowComponent>().addComponents(
                    Components.link('TMDB', link)
                )
            ]
        }
    }
}
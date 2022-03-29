import { Interactions } from '#khaf/Interaction';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { bold, time, type UnsafeEmbed as MessageEmbed } from '@discordjs/builders';
import { weather } from '@khaf/hereweather';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';

const ctof = (celcius: string | number): string => (+celcius * (9/5) + 32).toFixed(2);

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'weather',
            description: 'Gets the weather of a provided location!',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'location',
                    description: 'Location to get the weather of.',
                    required: true
                }
            ]
        };

        super(sc, { defer: true });
    }

    async init(interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | MessageEmbed> {
        const location = interaction.options.getString('location', true);
        const results = await weather(location);

        if (results === null) {
            return {
                content: '❌ An unexpected error occurred!',
                ephemeral: true
            }
        } else if (results.Type) {
            return {
                content: `❌ ${results.Type}`,
                ephemeral: true
            }
        }

        const first = results.observations?.location[0].observation[0];
        if (first === undefined) {
            return {
                content: '❌ No location found!',
                ephemeral: true
            }
        }

        return Embed.ok(`Last updated ${time(new Date(first.utcTime), 'f')}\n\n${first.description}`)
            .setThumbnail(first.iconLink)
            .setTitle(`Weather in ${first.city}, ${first.state ?? first.country ?? first.city}`)
            .setFooter({ text: '© 2020 HERE' })
            .addFields(
                { name: bold('Temperature:'), value: `${ctof(first.temperature)}°F, ${first.temperature}°C`, inline: true },
                { name: bold('High:'), value: `${ctof(first.highTemperature)}°F, ${first.highTemperature}°C`, inline: true },
                { name: bold('Low:'), value: `${ctof(first.temperature)}°F, ${first.temperature}°C`, inline: true },
                { name: bold('Humidity:'), value: `${first.humidity}%`, inline: true },
                { name: bold('Wind:'), value: `${first.windSpeed} MPH ${first.windDirection}° ${first.windDescShort}`, inline: true },
                { name: bold('Coordinates:'), value: `(${first.latitude}, ${first.longitude})`, inline: true }
            );
    }
}
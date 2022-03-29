import { Arguments, Command } from '#khaf/Command';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { bold, time, type UnsafeEmbed } from '@discordjs/builders';
import { weather } from '@khaf/hereweather';
import { Message } from 'discord.js';

const ctof = (celcius: string | number): string => (+celcius * (9/5) + 32).toFixed(2);

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Get the weather in a given location!',
                'Berlin, Germany',
                'Tunisia'
            ],
            {
                name: 'weather',
                folder: 'Utility',
                args: [1]
            }
        );
    }

    async init (_message: Message, { content }: Arguments): Promise<string | UnsafeEmbed> {
        const results = await weather(content);

        if (results === null) {
            return '❌ An unexpected error occurred!';
        } else if (results.Type) {
            return `❌ ${results.Type}`;
        }

        const first = results.observations?.location[0].observation[0];
        if (first === undefined) {
            return '❌ No location found!';
        }

        return Embed.ok(`Last updated ${time(new Date(first.utcTime), 'f')}\n\n${first.description}`)
            .setThumbnail(first.iconLink)
            .setTitle(`Weather in ${first.city}, ${first.state ?? first.country ?? first.city}`)
            .addFields(
                { name: bold('Temperature:'), value: `${ctof(first.temperature)}°F, ${first.temperature}°C`, inline: true },
                { name: bold('High:'), value: `${ctof(first.highTemperature)}°F, ${first.highTemperature}°C`, inline: true },
                { name: bold('Low:'), value: `${ctof(first.temperature)}°F, ${first.temperature}°C`, inline: true },
                { name: bold('Humidity:'), value: `${first.humidity}%`, inline: true },
                { name: bold('Wind:'), value: `${first.windSpeed} MPH ${first.windDirection}° ${first.windDescShort}`, inline: true },
                { name: bold('Coordinates:'), value: `(${first.latitude}, ${first.longitude})`, inline: true }
            )
            .setFooter({ text: '© 2020 HERE' });
    }
}
import { Arguments, Command } from '#khaf/Command';
import { bold, time } from '@khaf/builders';
import { weather } from '@khaf/hereweather';
import { Message } from 'discord.js';

const ctof = (celcius: string | number) => (+celcius * (9/5) + 32).toFixed(2);

export class kCommand extends Command {
    constructor() {
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

    async init(_message: Message, { content }: Arguments) {
        const results = await weather(content);

        if ('status' in results) {
            return `❌ An unexpected error occurred! Received status ${results.status} with text ${results.statusText}. Contact the bot owner to fix!`;
        } else if (results.Type) {
            return `❌ ${results.Type}`;
        }

        const first = results.observations?.location[0].observation[0];
        if (first === undefined) {
            return '❌ No location found!';
        }

        return this.Embed.ok(`Last updated ${time(new Date(first.utcTime), 'f')}\n\n${first.description}`)
            .setThumbnail(first.iconLink)
            .setTitle(`Weather in ${first.city}, ${first.state ?? first.country ?? first.city}`)
            .addField({ name: bold('Temperature:'), value: `${ctof(first.temperature)}°F, ${first.temperature}°C`, inline: true })
            .addField({ name: bold('High:'), value: `${ctof(first.highTemperature)}°F, ${first.highTemperature}°C`, inline: true })
            .addField({ name: bold('Low:'), value: `${ctof(first.temperature)}°F, ${first.temperature}°C`, inline: true })
            .addField({ name: bold('Humidity:'), value: `${first.humidity}%`, inline: true })
            .addField({ name: bold('Wind:'), value: `${first.windSpeed} MPH ${first.windDirection}° ${first.windDescShort}`, inline: true })
            .addField({ name: bold('Coordinates:'), value: `(${first.latitude}, ${first.longitude})`, inline: true })
            .setFooter({ text: `© 2020 HERE` });
    }
}
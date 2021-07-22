import { Command, Arguments } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { weather } from '@khaf/hereweather';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { time } from '@discordjs/builders';

const ctof = (celcius: string | number) => (+celcius * (9/5) + 32).toFixed(2);

@RegisterCommand
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

    async init(_message: Message, { args }: Arguments) {
        const results = await weather(args.join(' '));
        if ('status' in results) {
            return this.Embed.fail(`
            An unexpected error occurred! Received status ${results.status} with text ${results.statusText}. Contact the bot owner to fix!
            `);
        } else if (results.Type) {
            return this.Embed.fail(results.Type);
        }

        const first = results.observations.location?.[0].observation?.[0];
        if (first === undefined) {
            return this.Embed.fail('No location found!');
        }

        const embed = this.Embed.success(`Last updated ${time(new Date(first.utcTime), 'f')}\n\n${first.description}`)
            .setThumbnail(first.iconLink)
            .setTitle(`Weather in ${first.city}, ${first.state ?? first.country ?? first.city}`)
            .addField('**Temperature:**', `${ctof(first.temperature)}°F, ${first.temperature}°C`, true)
            .addField('**High:**', `${ctof(first.highTemperature)}°F, ${first.highTemperature}°C`, true)
            .addField('**Low:**', `${ctof(first.temperature)}°F, ${first.temperature}°C`, true)
            .addField('**Humidity:**', `${first.humidity}%`, true)
            .addField('**Wind:**', `${first.windSpeed} MPH ${first.windDirection}° ${first.windDescShort}`, true)
            .addField('**Coordinates:**', `(${first.latitude}, ${first.longitude})`, true)
            .setFooter(`© 2020 HERE`);

        return embed;
    }
}
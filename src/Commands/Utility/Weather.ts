import { Command } from "../../Structures/Command.js";
import { Message } from "discord.js";
import { weather } from "../../lib/Backend/HereWeather/HereWeather.js";
import { formatDate } from "../../lib/Utility/Date.js";

const ctof = (celcius: string | number) => {
    return (+celcius * (9/5) + 32).toFixed(2);
}

export default class extends Command {
    constructor() {
        super(
            [
                'Get the weather in a given location!',
                'Berlin, Germany',
                'Tunisia'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'weather',
                folder: 'Utility',
                args: [1]
            }
        );
    }

    async init(message: Message, args: string[]) {
        const results = await weather(args.join(' '));
        if('status' in results) {
            return message.channel.send(this.Embed.fail(`
            An unexpected error occurred! Received status ${results.status} with text ${results.statusText}. Contact the bot owner to fix!
            `));
        } else if(results.Type) {
            return message.channel.send(this.Embed.fail(results.Type));
        }

        const first = results.observations.location?.[0].observation?.[0];
        if(first === undefined) {
            return message.channel.send(this.Embed.fail('No location found!'));
        }

        const embed = this.Embed.success(first.description)
            .setThumbnail(first.iconLink)
            .setTitle(`Weather in ${first.city}, ${first.state ?? first.country ?? first.city}`)
            .addField('**Temperature:**', `${ctof(first.temperature)}°F, ${first.temperature}°C`, true)
            .addField('**High:**', `${ctof(first.highTemperature)}°F, ${first.highTemperature}°C`, true)
            .addField('**Low:**', `${ctof(first.temperature)}°F, ${first.temperature}°C`, true)
            .addField('**Humidity:**', `${first.humidity}%`, true)
            .addField('**Wind:**', `${first.windSpeed} MPH ${first.windDirection}° ${first.windDescShort}`, true)
            .addField('**Coordinates:**', `(${first.latitude}, ${first.longitude})`, true)
            .setFooter(`Last updated ${formatDate('MMMM Do, YYYY hh:mm:ss A t', first.utcTime)}\n© 2020 HERE`)

        return message.channel.send(embed);
    }
}
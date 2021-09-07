import { CommandInteraction } from 'discord.js';
import { Interactions } from '../../Structures/Interaction.js';
import { SlashCommandBuilder, time } from '@discordjs/builders';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';
import { weather } from '@khaf/hereweather';

const ctof = (celcius: string | number) => (+celcius * (9/5) + 32).toFixed(2);

export class kInteraction extends Interactions {
    constructor() {
        const sc = new SlashCommandBuilder()
            .setName('weather')
            .addStringOption(option => option
                .setName('location')
                .setDescription('Location to get weather of.')
                .setRequired(true)
            )
            .setDescription('Get the weather!');

        super(sc, { defer: true });
    }

    async init(interaction: CommandInteraction) {
        const location = interaction.options.getString('location', true);
        const results = await weather(location);

        if ('status' in results) {
            return `❌ An unexpected error occurred! Received status ${results.status} with text ${results.statusText}. Contact the bot owner to fix!`;
        } else if (results.Type) {
            return `❌ ${results.Type}`;
        }

        const first = results.observations?.location?.[0].observation?.[0];
        if (first === undefined) {
            return '❌ No location found!';
        }

        return Embed.success(`Last updated ${time(new Date(first.utcTime), 'f')}\n\n${first.description}`)
            .setThumbnail(first.iconLink)
            .setTitle(`Weather in ${first.city}, ${first.state ?? first.country ?? first.city}`)
            .addField('**Temperature:**', `${ctof(first.temperature)}°F, ${first.temperature}°C`, true)
            .addField('**High:**', `${ctof(first.highTemperature)}°F, ${first.highTemperature}°C`, true)
            .addField('**Low:**', `${ctof(first.temperature)}°F, ${first.temperature}°C`, true)
            .addField('**Humidity:**', `${first.humidity}%`, true)
            .addField('**Wind:**', `${first.windSpeed} MPH ${first.windDirection}° ${first.windDescShort}`, true)
            .addField('**Coordinates:**', `(${first.latitude}, ${first.longitude})`, true)
            .setFooter(`© 2020 HERE`);
    }
} 
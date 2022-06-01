import { ImageUtil } from '#khaf/image/ImageUtil.js';
import { Interactions } from '#khaf/Interaction';
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js';
import { arrayBufferToBuffer } from '#khaf/utility/FetchUtils.js';
import { weather, type LocationObservation } from '@khaf/hereweather';
import { createCanvas, Image, type SKRSContext2D } from '@napi-rs/canvas';
import { ApplicationCommandOptionType, type RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import type { Buffer } from 'node:buffer';
import { request } from 'undici';

const imageColors = {
    darkBlue: '#1c2a4f',
    navyBlue: '#29395c',
    horizontalDiv: '#5c6b85'
} as const;

const ctof = (celcius: string | number): number => Number((Number(celcius) * (9/5) + 32).toFixed(2));

const resizeText = (ctx: SKRSContext2D, text: string, maxWidth: number, fontSize: number): string => {
    ctx.font = `${fontSize}px Arial`;
    let width = ctx.measureText(text).width;

    if (width > maxWidth) {
        let newfontSize = fontSize;
        let decrement = 1;
        let newWidth = 0;

        while (width > maxWidth) {
            newfontSize -= decrement;
            if (newfontSize < 10) {
                return '10px';
            }

            ctx.font = `${newfontSize}px Arial`;
            newWidth = ctx.measureText(text).width;

            if (newWidth < maxWidth && decrement === 1) {
                decrement = 0.1;
                newfontSize += 1;
            } else {
                width = newWidth;
            }
        }

        return `${newfontSize}px`;
    } else {
        return `${fontSize}px`;
    }
}

const monthF = new Intl.DateTimeFormat('en-US', { month: 'long' }).format;
const weekdayF = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format;

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

    async init(interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const location = interaction.options.getString('location', true);
        const results = await weather(location);

        if (results === null) {
            return {
                content: '❌ An unexpected error occurred!',
                ephemeral: true
            }
        } else if ('Type' in results) {
            return {
                content: `❌ ${results.Type}: ${results.Message.join('; ')}`,
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

        const buffer = await this.image(first);

        return {
            embeds: [
                Embed.json({
                    color: colors.ok,
                    image: { url: 'attachment://weather.png' }
                })
            ],
            files: [{
                attachment: buffer,
                name: 'weather.png'
            }]
        }
    }

    async image (weather: LocationObservation[number]): Promise<Buffer> {
        const { body } = await request(weather.iconLink);
        const buffer = arrayBufferToBuffer(await body.arrayBuffer());

        const image = new Image();
        image.width = image.height = 150;
        image.src = buffer;

        const canvas = createCanvas(520, 320);
        const ctx = canvas.getContext('2d');

        const leftOffset = canvas.width * .05;
        let height = canvas.height * .2;

        const writeHorizontalDiv = (): void => {
            ctx.fillStyle = imageColors.horizontalDiv;
            ctx.fillRect(canvas.height * .05, (height += 12), canvas.width * .6, 2);
        }

        // draw right side beackground
        ctx.fillStyle = imageColors.darkBlue;
        ctx.fillRect(canvas.width * .66, 0, canvas.width * .34, canvas.height);

        // draw left side background
        ctx.fillStyle = imageColors.navyBlue;
        ctx.fillRect(0, 0, canvas.width * .66, canvas.height);

        // draw image on right side
        ImageUtil.centerImage(
            ctx,
            image,
            canvas.width * (.66 + .17), // 2/3rds + half of 1/3rd
            canvas.height / 2,
            image.width,
            image.height
        );

        // Title
        const location = weather.country ? `${weather.city}, ${weather.country}` : `${weather.city}`;
        ctx.fillStyle = '#fff'
        ctx.font = `${resizeText(ctx, location, (canvas.width * .56), 50)} Arial`
        ctx.fillText(location, leftOffset, height)

        // write time the weather was updated at
        const utcTime = new Date(weather.utcTime);
        const weekday = weekdayF(utcTime);
        const month = monthF(utcTime);
        const hour12 = utcTime.toLocaleString('en-US', { hour: 'numeric', hour12: true });
        const time = `${weekday}, ${utcTime.getDate()} ${month} || ${hour12}`;

        ctx.font = '16px Arial';
        ctx.fillText(time, leftOffset, (height += 30));

        // write full location
        const fullLocation = weather.state
            ? `${weather.city}, ${weather.state} - ${weather.country}`
            : `${weather.city} - ${weather.country}`;

        ctx.font = `${resizeText(ctx, location, (canvas.width * .56), 15)} Arial`
        ctx.fillText(fullLocation, leftOffset, (height += 20), canvas.width * .66)

        // horizontal divider
        writeHorizontalDiv();

        // temperature (Math.round celcius->farenheit)
        const temp = `${Math.round(ctof(weather.temperature))}°F`;
        ctx.fillStyle = '#fff';
        ctx.font = '50px Arial';
        ctx.fillText(temp, leftOffset, (height += 55));
        const width = ctx.measureText(temp).width;

        // high/low
        const low = Math.round(ctof(weather.lowTemperature));
        ctx.font = '20px Arial';
        ctx.fillText(`Low: ${low}°F`, leftOffset + width + 15, height - 25);

        const high = Math.round(ctof(weather.highTemperature));
        ctx.fillText(`High: ${high}°F`, leftOffset + width + 15, height);

        ctx.font = `italic ${ctx.font}`;
        ctx.fillText(weather.description, leftOffset, (height += 30));

        // divider
        writeHorizontalDiv();

        // wind
        const wind = `Wind: ${weather.windSpeed} MPH (${weather.windDescShort})`;
        ctx.fillStyle = '#fff';
        ctx.font = '13px Arial';
        ctx.fillText(wind, leftOffset, (height += 25));

        const humidity = `Humidity: ${weather.humidity}%`;
        ctx.fillText(humidity, leftOffset, (height += 17.5));

        const elevation = `Elevation: ${weather.elevation}m`;
        ctx.fillText(elevation, leftOffset, (height += 17.5));

        const feelsLike = `Feels Like: ${Math.round(ctof(weather.comfort))}°F`;
        ctx.fillText(feelsLike, leftOffset, (height += 17.5));

        return canvas.toBuffer('image/png');
    }
}
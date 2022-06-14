import { ImageUtil } from '#khaf/image/ImageUtil.js';
import { Interactions } from '#khaf/Interaction';
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js';
import { weather as assets } from '#khaf/utility/Constants/Path.js';
import { weather, type LocationObservation } from '@khaf/hereweather';
import { createCanvas, Image, type SKRSContext2D } from '@napi-rs/canvas';
import { ApplicationCommandOptionType, type RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import type { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';

const imageColors = {
    darkBlue: '#1c2a4f',
    navyBlue: '#29395c',
    horizontalDiv: '#5c6b85'
} as const;

const fileMetadata = {
    1: { path: assets('sunny.png'), author: 'Azland Studio' },
    2: { path: assets('cloudy-big-sun.png'), author: 'Hasanudin' },
    3: { path: assets('sunny-very-cloudy.png'), author: 'joe pictos' },
    4: { path: assets('sun-below-clouds.png'), author: 'Tara' },
    5: { path: assets('rain.png'), author: 'Kimmi Studio' },
    6: { path: assets('lightning-dark.png'), author: 'Andrejs Kirma' },
    7: { path: assets('lightning.png'), author: 'Andrejs Kirma' },
    8: { path: assets('clouds.png'), author: 'Aya Sofya' },
    9: { path: assets('sunny-storm.png'), author: 'Vector Portal' },
    10: { path: assets('sunny-storm.png'), author: 'Vector Portal' },
    11: { path: assets('thunderstorm-cloudy.png'), author: 'Caesar Rizky Kurniawan' },
    12: { path: assets('sun-below-clouds.png'), author: 'Tara' },
    13: { path: assets('cloudy.png'), author: 'Pham Duy Phuong Hung' },
    14: { path: assets('moon-cloud.png'), author: 'arif fajar yulianto' },
    15: { path: assets('thunderstorm-cloudy-night.png'), author: 'Jessigue' },
    16: { path: assets('moon.png'), author: '11Umbrella' },
    17: { path: assets('cloud.png'), author: 'Aya Sofya' },
    18: { path: assets('hail.png'), author: 'Philipp Koerner' },
    19: { path: assets('hail-thunderstorm.png'), author: 'Delwar Hossain' },
    20: { path: assets('snowing.png'), author: 'Tim Boelaars' },
    21: { path: assets('moon-cloud.png'), author: 'arif fajar yulianto' },
    22: { path: assets('night-rain.png'), author: 'Iconspace' },
    23: { path: assets('moon-cloud.png'), author: 'arif fajar yulianto' },
    24: { path: assets('moon-cloud.png'), author: 'arif fajar yulianto' },
    25: { path: assets('frozen-cloud.png'), author: 'lastspark' },
    26: { path: assets('rain-snow-cloud.png'), author: 'Andrejs Kirma' },
    27: { path: assets('drizzling.png'), author: 'Dmitry Baranovskiy' },
    28: { path: assets('storm-cloud.png'), author: 'Marco Livolsi' },
    29: { path: assets('tornado.png'), author: 'DPIcons' },
    30: { path: assets('umbrella-windy.png'), author: 'LUTFI GANI AL ACHMAD' },
    31: { path: assets('umbrella-windy.png'), author: 'LUTFI GANI AL ACHMAD' },
    32: { path: assets('umbrella-windy.png'), author: 'LUTFI GANI AL ACHMAD' }
} as const

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

const iconLinkToPath = (link: string): { path: string, author: string } => {
    const id = basename(link, extname(link)) as `${number}`;

    if (id in fileMetadata) {
        return fileMetadata[Number(id) as keyof typeof fileMetadata];
    }

    return fileMetadata[1];
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
        const { author, path } = iconLinkToPath(weather.iconLink);
        const buffer = await readFile(path);

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

        // draw right side background
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

        // credit
        const credit = `Icon created by ${author} from Noun Project`;
        ctx.font = '10px Arial';
        const creditLines = ImageUtil.split(credit, canvas.width * .33, ctx);

        for (const line of creditLines) {
            ctx.fillText(
                line,
                canvas.width * .67,
                (canvas.height - ((creditLines.length - creditLines.indexOf(line)) * 10))
            );
        }

        return canvas.toBuffer('image/png');
    }
}
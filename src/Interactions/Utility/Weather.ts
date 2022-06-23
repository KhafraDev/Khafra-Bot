import { Interactions } from '#khaf/Interaction';
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js';
import { wttrin, type WttrInResult } from '@khaf/weather';
import { createCanvas, Image, type SKRSContext2D } from '@napi-rs/canvas';
import { ApplicationCommandOptionType, type RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import type { Buffer } from 'node:buffer';
import { weather } from '#khaf/utility/Constants/Path.js';
import { existsSync, readFileSync } from 'node:fs';
import { ImageUtil } from '#khaf/image/ImageUtil.js';

const imageColors = {
    darkBlue: '#1c2a4f',
    navyBlue: '#29395c',
    horizontalDiv: '#5c6b85'
} as const;

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

const sunrise = new Image();
sunrise.width = 44;
sunrise.height = 22;
sunrise.src = readFileSync(weather('sunrise.png'));

const sunset = new Image();
sunset.width = 44;
sunset.height = 22;
sunset.src = readFileSync(weather('sunset.png'));

const cache = new Map<string, Image>();

const iconFromDesc = (desc: string): Image => {
    const imageCached = cache.get(desc);

    if (imageCached) {
        return imageCached;
    }

    const path = weather(`${desc.replace(/\s/g, '-')}.png`);
    const image = new Image();
    image.width = image.height = 150;
    image.src = existsSync(path)
        ? readFileSync(path)
        : readFileSync(weather('partly-cloudy.png'));

    cache.set(desc, image);
    return image;
}

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
        const results = await wttrin(location);
        const buffer = await this.image(results);

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

    async image (weather: WttrInResult): Promise<Buffer> {
        const canvas = createCanvas(520, 320);
        const ctx = canvas.getContext('2d');

        const leftOffset = canvas.width * .05;
        let height = canvas.height * .2;

        const writeHorizontalDiv = (): void => {
            ctx.fillStyle = imageColors.horizontalDiv;
            ctx.fillRect(canvas.height * .05, (height += 12), canvas.width * .6, 2);
        }

        const writeMiscInfo = (text: string, addHeight: number): void => {
            ctx.fillText(text, leftOffset, (height += addHeight));
        }

        // draw right side background
        ctx.fillStyle = imageColors.darkBlue;
        ctx.fillRect(canvas.width * .66, 0, canvas.width * .34, canvas.height);

        // draw left side background
        ctx.fillStyle = imageColors.navyBlue;
        ctx.fillRect(0, 0, canvas.width * .66, canvas.height);

        const utcTime = new Date(weather.current_condition[0].localObsDateTime);
        const nearest = weather.nearest_area[0];
        const current = weather.current_condition[0];
        const forecast = weather.weather[0];
        const astronomy = forecast.astronomy[0];
        const hourly = forecast.hourly[(utcTime.getHours() / 3) - 1] ?? forecast.hourly.at(-1)!;

        // draw image on right side
        const image = iconFromDesc(hourly.weatherDesc[0].value.toLowerCase());
        ImageUtil.centerImage(
            ctx,
            image,
            canvas.width * (.66 + .17), // 2/3rds + half of 1/3rd
            canvas.height / 2,
            image.width,
            image.height
        );

        // Title
        const country = nearest.country[0].value;
        const city = nearest.areaName[0].value;
        const state = nearest.region.length === 0 ? null : nearest.region[0].value;

        // "Berlin, Germany"
        // "Albany, New York"
        const location = country === 'United States of America'
            ? `${city}, ${state}`
            : `${city}, ${country}`;
        ctx.fillStyle = '#fff';
        ctx.font = `${resizeText(ctx, location, (canvas.width * .56), 50)} Arial`;
        ctx.fillText(location, leftOffset, height);

        // write time the weather was updated at
        const weekday = weekdayF(utcTime);
        const month = monthF(utcTime);
        const hour12 = utcTime.toLocaleString('en-US', { hour: 'numeric', hour12: true });
        const time = `${weekday}, ${utcTime.getDate()} ${month} // ${hour12}`;

        ctx.font = '16px Arial';
        ctx.fillText(time, leftOffset, (height += 25));

        // horizontal divider
        writeHorizontalDiv();

        // temperature
        const temp = `${Math.round(Number(current.temp_F))}°F`;
        ctx.fillStyle = '#fff';
        ctx.font = '44px Arial';
        ctx.fillText(temp, leftOffset, (height += 45));

        // feels like
        const feelsLike = `Feels Like: ${Math.round(Number(current.FeelsLikeF))}°F`;
        const width = ctx.measureText(temp).width;
        ctx.font = '16px Arial';
        ctx.fillText(feelsLike, leftOffset + width + 5, height);

        // high/low
        const low = Math.round(Number(forecast.mintempF));
        const high = Math.round(Number(forecast.maxtempF));
        ctx.font = '16px Arial';
        ctx.fillText(`${low}°F / ${high}°F`, leftOffset, (height += 25));

        // description
        ctx.font = `italic ${ctx.font}`;
        ctx.fillText(
            hourly.weatherDesc.map(v => v.value).join(', '),
            leftOffset,
            (height += 25)
        );

        // divider
        writeHorizontalDiv();

        // misc info
        ctx.fillStyle = '#fff';
        ctx.font = '13px Arial';

        writeMiscInfo(`Wind: ${current.windspeedMiles}m/h (${current.winddir16Point})`, 25)
        writeMiscInfo(`Humidity: ${current.humidity}%`, 17.5);

        // sunset & sunrise
        // (width * .6 - width(time) - 44)
        const x = (canvas.width * .6) - ctx.measureText('00:00 pm').width;

        ctx.drawImage(sunrise, x - 50, height - 32.5, 44, 22);
        ctx.fillText(astronomy.sunrise.slice(1), x, height - 15);
        ctx.drawImage(sunset, x - 50, height - 5, 44, 22);
        ctx.fillText(astronomy.sunset.slice(1), x, height + 10);

        // precipitation
        writeMiscInfo(`Chance of Rain: ${hourly.chanceofrain}%`, 17.5);

        if (hourly.chanceofsnow !== '0') {
            writeMiscInfo(`Chance of Snow: ${hourly.chanceofsnow}%`, 17.5);
        }

        return canvas.toBuffer('image/png');
    }
}
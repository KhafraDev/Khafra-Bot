import { Interactions } from '#khaf/Interaction';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { bold } from '@discordjs/builders';
import { createCanvas } from '@napi-rs/canvas';
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ApplicationCommandOptionType } from 'discord-api-types/v10';
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import { Attachment } from 'discord.js';
import type { Buffer } from 'node:buffer';

type RGB = [number, number, number];

const randomRGB = (): RGB => [
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256)
];
const rgbToHex = (rgb: RGB): string =>
    '#' + rgb.map(c => c.toString(16).padStart(2, '0')).join('');
const hexToRgb = (hex: string): RGB => hex.slice(1).replace(
    /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
    (_: string, r: string, g: string, b: string): string => r + r + g + g + b + b
).match(/.{2}/g)!.map(x => parseInt(x, 16)) as RGB;

export class kInteraction extends Interactions {
    constructor () {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'color',
            description: 'Show different colors!',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'hex-color',
                    description: 'Hex color (ie. #FFFFFF) to display.'
                }
            ]
        };

        super(sc);
    }

    async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const hex = interaction.options.getString('hex-color');
        const isHex = hex && /^#+([A-F0-9]{6}|[A-F0-9]{3})$/i.test(hex);

        const rgb = isHex ? hexToRgb(hex) : randomRGB();
        const hexColor = isHex ? hex : rgbToHex(rgb);
        const isRandom = hex === hexColor ? 'Random Color' : '';

        const buffer = await this.image(hexColor);
        const attachment = new Attachment(buffer, 'color.png');

        return {
            embeds: [
                Embed.ok(`
				${isRandom}
				● ${bold('Hex Color Code:')} ${hexColor}
				● ${bold('RGB:')} (${rgb.join(', ')})
				`).setImage('attachment://color.png')
            ],
            files: [attachment]
        }
    }

    async image (hex: string): Promise<Buffer> {
        const canvas = createCanvas(128, 128);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = hex;
        ctx.fillRect(0, 0, 128, 128);

        return canvas.toBuffer('image/png');
    }
}
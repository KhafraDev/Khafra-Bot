import { InteractionSubCommand } from '#khaf/Interaction';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { bold } from '@discordjs/builders';
import { getCapes, UUID } from '@khaf/minecraft';
import { createCanvas, Image } from '@napi-rs/canvas';
import { Buffer } from 'buffer';
import { ChatInputCommandInteraction, InteractionReplyOptions, MessageAttachment } from 'discord.js';
import { request } from 'undici';

// Rinse - optifine and migrator cape
// Bes - optifine cape
// Mom - minecon 2016
// TODO: add labymod https://dl.labymod.net/capes/

const missingCapeWarning =
	'⚠️ This account may have more capes than shown! ' +
	'Mojang only shows the active cape! ⚠️';

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'minecraft',
            name: 'capes'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const username = interaction.options.getString('username', true);

        const uuid = await UUID(username);
        const capes = uuid !== null ? await getCapes(uuid.id) : [];

        if (uuid === null) {
            return {
                content: '❌ Player could not be found!',
                ephemeral: true
            }
        }

        const buffer = await this.image([...capes, `http://s.optifine.net/capes/${username}.png`]);

        if (typeof buffer === 'string') {
            return { content: buffer }
        }

        const attachment = new MessageAttachment(buffer, 'capes.png');

        return {
            embeds: [
                Embed.ok(`
				${missingCapeWarning}

				● ${bold('Username:')} ${uuid.name}
				● ${bold('ID:')} ${uuid.id}
				`).setImage('attachment://capes.png')
            ],
            files: [attachment]
        }
    }

    async image (urls: string[]): Promise<Buffer | string> {
        const canvas = createCanvas((120 * urls.length) + (5 * urls.length), 170); // 12x17 w/ scale 10
        const ctx = canvas.getContext('2d');

        for (const url of urls) {
            const { body, statusCode } = await request(url);

            if (statusCode !== 200) {
                if (urls.length === 1) {
                    return '❌ Player has no capes, or an error occurred rendering them!';
                }

                continue; // so we don't get an invalid body (ie. user doesn't have optifine cape)
            }

            const b = Buffer.from(await body.arrayBuffer());

            const cape = new Image();
            cape.src = b;

            const tmpCanvas = createCanvas(12, 17);
            const tmpCtx = tmpCanvas.getContext('2d');
            tmpCtx.drawImage(cape, 0, 0);

            const data = tmpCtx.getImageData(0, 0, 12, 17);
            const idx = urls.indexOf(url);
            const xOffset = (120 * idx) + (5 * idx);

            for (let i = 0; i < data.data.length; i += 4) {
                const x = (i / 4 % tmpCanvas.width);
                const y = (i / 4 - x) / tmpCanvas.width;

                const [r, g, b, a] = data.data.slice(i, i + 4);

                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
                ctx.fillRect(x * 10 + xOffset, y * 10, 10, 10);
            }

            ctx.clearRect(xOffset, 0, 10, 10); // remove top left corner
            ctx.clearRect(xOffset + 110, 0, 10, 10); // remove top right corner
        }

        return canvas.toBuffer('image/png');
    }
}
import { Command } from "../../Structures/Command.js";
import { Message } from "discord.js";
import { join } from "path";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { promisify } from "util";
import { randomInt } from "crypto";

const rand: (a: number, b?: number) => Promise<number> = promisify(randomInt);

const APOD_PATH = join(process.cwd(), 'assets/NASA.json');
const exists = existsSync(APOD_PATH);
const file: {
    [key: string]: {
        copyright?: string | undefined
        hdurl: string
        title: string
        date: string
    }
} | null = exists
    ? JSON.parse(await readFile(APOD_PATH, 'utf-8'))
    : null;

export default class extends Command {
    constructor() {
        super(
            [
                'Get a random Astronomy Photo of the Day (APOD) supplied by NASA.',
                ''
            ],
			{
                name: 'apod',
                folder: 'Utility',
                args: [0, 0],
                aliases: [ 'nasa' ]
            }
        );
    }

    async init(message: Message) {
        if(!file) {
            return message.reply(this.Embed.fail(`
            Ask the bot owner to download the pre-existing NASA APOD data from the bot's repo or use the command \`\`apodfetch\`\`!
            `));
        }
        
        const keys = Object.keys(file);
        const photo = file[keys[await rand(keys.length)]];

        const embed = this.Embed.success()
            .setTitle(photo.title)
            .setImage(photo.hdurl);
            
        photo.copyright ? embed.setFooter(`© ${photo.copyright}`) : '';
        return message.reply(embed)
    }
}

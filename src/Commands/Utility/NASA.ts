import { Command } from "../../Structures/Command.js";
import { Message } from "discord.js";
import { join } from "path";
import { existsSync } from "fs";
import { promisify } from "util";
import { randomInt } from "crypto";

const rand: (a: number, b?: number) => Promise<number> = promisify(randomInt);

const APOD_PATH = join(process.cwd(), 'assets/NASA.json');
const exists = existsSync(APOD_PATH);
const file = exists
    ? (await import('../../../assets/NASA.json')).default
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
        
        const keys = Object.keys(file) as Array<keyof typeof file>;
        const key = keys[await rand(keys.length)]; 
        const photo = file[key];

        const embed = this.Embed.success()
            .setTitle(photo.title)
            .setImage(photo.hdurl);
            
        'copyright' in photo ? embed.setFooter(`© ${photo.copyright}`) : '';
        return message.reply(embed);
    }
}

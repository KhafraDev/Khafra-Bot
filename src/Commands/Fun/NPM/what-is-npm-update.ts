import { Command } from "../../../Structures/Command.js";
import { Message } from "discord.js";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import fetch from "node-fetch";
import { existsSync } from "fs";

const npmPath = join(process.cwd(), 'assets', 'npm');
await mkdir(npmPath, { recursive: true });

export let exists = existsSync(join(npmPath, 'npm.txt'));

export default class extends Command {
    constructor() {
        super(
            [
                'Update npm sayings.',
                ''
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'npmnew',
                folder: 'Fun',
                args: [0, 0],
                aliases: [ 'npmupdate' ],
                ownerOnly: true
            }
        );
    }

    async init(message: Message) {
        let res;
        try {
            res = await fetch('https://raw.githubusercontent.com/npm/npm-expansions/master/expansions.txt');
        } catch {
            return message.channel.send(this.Embed.fail(`An error occurred fetching the file!`));
        }

        if(!res.ok) {
            return message.channel.send(this.Embed.fail(`An error occurred fetching the file!`));
        }

        const text = await res.text();
        const lines = text
            .split(/\r\n|\n/g)
            .filter(l => !l.startsWith('#'));

        await writeFile(join(npmPath, 'npm.txt'), lines.join('\n').trim());
        exists = true;
        return message.channel.send(this.Embed.success(`Added ${lines.length} NPM expansions.`));
    }
}
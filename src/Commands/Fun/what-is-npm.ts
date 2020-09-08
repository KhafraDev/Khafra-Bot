import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import { writeFile, mkdir, readFile } from 'fs/promises';
import fetch from 'node-fetch';
import Embed from "../../Structures/Embed";
import { join } from 'path';

// if list has been updated.
// runs once at start
let updated = false;

export default class extends Command {
    constructor() {
        super(
            [
                'What does "NPM" stand for?',
                ''
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'whatisnpm',
                folder: 'Fun',
                args: [0, 0],
                aliases: [ 'what-is-npm', 'whatsnpm', 'whatisnpm?', 'what-is-npm?', 'whatsnpm?', 'whats-npm?', 'whats-npm' ]
            }
        );
    }

    async init(message: Message) {
        if(!updated) {
            const res = await fetch('https://raw.githubusercontent.com/npm/npm-expansions/master/expansions.txt');
            if(!res.ok) {
                return message.channel.send(Embed.fail(`
                An unexpected error occurred! Received status ${res.status} with text ${res.statusText}. Contact the bot owner to fix!
                `));
            }

            const text = await res.text();
            await mkdir(join(__dirname, 'npm'), { recursive: true });
            const valid = text
                .split(/\n\r|\n|\r/g)
                .filter(l => !l.startsWith('#'))
                .join('\n')
                .trim();

            await writeFile(join(__dirname, 'npm', 'npm.txt'), valid);
            updated = true;
        }

        const file = await readFile(join(__dirname, 'npm', 'npm.txt'));
        const data = file
            .toString()
            .split('\n')
            .filter(l => l.trim().length > 0);

        return message.channel.send(Embed.success('``' + data[Math.random() * data.length << 0] + '``'));
    }
}
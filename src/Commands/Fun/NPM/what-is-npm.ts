import { Command } from "../../../Structures/Command.js";
import { Message } from "discord.js";
import { readFile } from 'fs/promises';
import { join } from 'path';
import { exists } from "./what-is-npm-update.js";

const npmPath = join(process.cwd(), 'assets', 'npm', 'npm.txt');

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
        if(!exists) {
            return message.channel.send(this.Embed.fail(`
            Ask the bot owner to use the \`\`npmnew\`\` command to use this command!
            `));
        }

        const file = await readFile(npmPath, 'utf-8');
        const lines = file.split(/\r\n|\n/g);
        return message.channel.send(this.Embed.success(`
        \`\`${lines[Math.floor(Math.random() * lines.length)]}\`\`
        `));
    }
}
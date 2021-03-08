import { Command } from '../../Structures/Command.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super([], {
            name: 'links',
            folder: 'Bot',
            args: [0, 0],
            aliases: ['link']
        });
    }

    init() {
        return this.Embed.success(`
        [Khafra-Bot GitHub](https://github.com/khafradev/khafra-bot)
        [Synergism Discord](https://discord.gg/synergism)

        Want to help the bot? [Donate to Platonic](https://patreon.com/synergism). :)
        `);
    }
}
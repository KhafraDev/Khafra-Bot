import { Command } from '../../Structures/Command.js';
import { forgotify } from '../../lib/Packages/Forgotify.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Listen to songs on Spotify that no one else has.',
                'Forgotify.com - "Millions of songs on Spotify have been forgotten."'
            ],
            {
                name: 'forgotify',
                folder: 'Fun',
                args: [0, 0]
            }
        )
    }

    async init() {
        const song = await forgotify();

        return this.Embed.success(`[${song.title}](${song.url})`);
    }
}
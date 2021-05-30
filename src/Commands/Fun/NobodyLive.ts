import { Command } from '../../Structures/Command.js';
import { nobodyLive } from '../../lib/Packages/NobodyLive.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Visit a Twitch streamer who has no viewers (https://nobody.live/)'
            ],
			{
                name: 'nobodylive',
                folder: 'Fun',
                aliases: ['nobody.live'],
                args: [0, 1],
                errors: {
                    AssertionError: 'Unexpected results received from server!'
                }
            }
        );
    }

    async init() {
        const stream = await nobodyLive();

        return this.Embed
            .success(`${stream.url} - ${stream.title}`)
            .setImage(stream.thumbnail_url)
            .setFooter('https://nobody.live/');
    }
}
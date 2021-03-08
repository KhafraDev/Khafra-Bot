import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { spotify } from '../../lib/Backend/Spotify/SpotifyHandler.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Search for a song on Spotify',
                'Bohemian Rhapsody',
                'Boston - More Than a Feeling',
                ''
            ],
			{
                name: 'spotify',
                folder: 'Utility',
                args: [0]
            }
        );
    }

    async init(message: Message, args: string[]) {
        const presence = message.author.presence.activities.filter(activity => 
            activity.type === 'LISTENING' && activity.name === 'Spotify'
        ).pop();

        if (!presence && args.length < 1) {
            return this.Embed.fail('If you are not listening to any songs, a search query must be provided!');
        }

        const res = await spotify.search(
            presence && args.length === 0
                ? `${presence.details}${presence.state ? ' - ' + presence.state : ''}`
                : args.join(' ')
        );

        if (res.tracks.items.length === 0) {
            return this.Embed.fail('No songs found!');
        }

        return this.Embed.success(`
        ${res.tracks.items.map(item => `[${item.name}](${item.external_urls.spotify}) by ${item.artists.map(a => a.name).join(' and ')}`).join('\n')}
        `);
    }
}
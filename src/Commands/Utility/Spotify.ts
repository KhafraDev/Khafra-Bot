import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';

import { spotify } from '../../lib/Backend/Spotify/SpotifyHandler.js';
import { SpotifyResult } from '../../lib/Backend/Spotify/types/Spotify';

export default class extends Command {
    constructor() {
        super(
            [
                'Search for a song on Spotify',
                'Bohemian Rhapsody',
                'Boston - More Than a Feeling',
                ''
            ],
            [ /* No extra perms needed */],
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

        if(!presence && args.length < 1) {
            return message.reply(this.Embed.fail('If you are not listening to any songs, a search query must be provided!'));
        }

        let res: SpotifyResult;
        try {
            res = await spotify.search(
                presence && args.length === 0
                    ? `${presence.details}${presence.state ? ' - ' + presence.state : ''}`
                    : args.join(' ')
            );
        } catch {
            return message.reply(this.Embed.fail('An unexpected error occurred!'));
        }

        if(res.tracks.items.length === 0) {
            return message.reply(this.Embed.fail('No songs found!'));
        }

        const embed = this.Embed.success(`
        ${res.tracks.items.map(item => `[${item.name}](${item.external_urls.spotify}) by ${item.artists.map(a => a.name).join(' and ')}`).join('\n')}
        `);

        return message.reply(embed);
    }
}
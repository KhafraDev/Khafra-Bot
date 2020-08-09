import { Command } from '../../Structures/Command';
import { Message } from 'discord.js';
import Embed from '../../Structures/Embed';
import { spotify } from '../../Backend/CommandStructures/SpotifyHandler';
import { SpotifyResult } from '../../Backend/types/spotify';

export default class extends Command {
    constructor() {
        super(
            { name: 'spotify', folder: 'Utility' },
            [
                'Search for a song on Spotify',
                'Bohemian Rhapsody',
                'Boston - More Than a Feeling',
                ''
            ],
            [ /* No extra perms needed */],
            10
        );
    }

    async init(message: Message, args: string[]) {
        const presence = message.author.presence.activities.filter(activity => 
            activity.type === 'LISTENING' && activity.name === 'Spotify'
        ).pop();

        if(!presence && args.length < 1) {
            return message.channel.send(Embed.missing_args(1, this.name.name, this.help.slice(1)));
        }

        let res: SpotifyResult;
        try {
            res = await spotify.search(
                presence && args.length === 0
                    ? `${presence.details}${presence.state ? ' - ' + presence.state : ''}`
                    : args.join(' ')
            );
        } catch {
            return message.channel.send(Embed.fail('An unexpected error occurred!'));
        }

        if(res.tracks.items.length === 0) {
            return message.channel.send(Embed.fail('No songs found!'));
        }

        const embed = Embed.success(`
        ${res.tracks.items.map(item => `[${item.name}](${item.external_urls.spotify}) by ${item.artists.map(a => a.name).join(' and ')}`).join('\n')}
        `);

        return message.channel.send(embed);
    }
}
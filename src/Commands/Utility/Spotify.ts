import { Arguments, Command } from '#khaf/Command';
import { type UnsafeEmbed } from '@discordjs/builders';
import { spotify } from '@khaf/spotify';
import { ActivityType } from 'discord-api-types/v10';
import { Message } from 'discord.js';

export class kCommand extends Command {
    constructor () {
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

    async init(message: Message, { args }: Arguments): Promise<UnsafeEmbed> {
        const presence = message.member!.presence?.activities.filter(activity =>
            activity.type === ActivityType.Listening && activity.name === 'Spotify'
        ).pop();

        if (!presence && args.length < 1) {
            return this.Embed.error('If you are not listening to any songs, a search query must be provided!');
        }

        const res = await spotify.search(
            presence && args.length === 0
                ? `${presence.details}${presence.state ? ' - ' + presence.state : ''}`
                : args.join(' ')
        );

        const image = res.tracks.items[0].album.images.reduce((a, b) => {
            return a.height > b.height ? a : b;
        }, { height: 0, width: 0, url: '' });

        if (res.tracks.items.length === 0) {
            return this.Embed.error('No songs found!');
        }

        return this.Embed.ok(`
        ${res.tracks.items.map(item => `[${item.name}](${item.external_urls.spotify}) by ${item.artists.map(a => a.name).join(' and ')}`).join('\n')}
        `).setImage(image.url);
    }
}
import { Command } from '../../Structures/Command';
import { Message } from 'discord.js';
import Embed from '../../Structures/Embed';
import { spotify } from '../../Backend/Commands/SpotifyHandler';
import { SpotifyResult } from '../../Backend/types/spotify.i';

export default class extends Command {
    constructor() {
        super(
            'spotify',
            'Search for a song on Spotify',
            [ /* No extra perms needed */],
            10
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.hasPermissions(message)) {
            return message.channel.send(Embed.missing_perms(this.permissions));
        } else if(args.length < 1) {
            return message.channel.send(Embed.missing_args(1, this.name, [
                'Bohemian Rhapsody',
                'Boston - More Than a Feeling'
            ]));
        }

        let res: SpotifyResult;
        try {
            res = await spotify.search(args.join(' '));
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
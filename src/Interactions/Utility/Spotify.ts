import { ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { Interactions } from '#khaf/Interaction';
import { hyperlink, inlineCode } from '@khaf/builders';
import { spotify } from '@khaf/spotify';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'spotify',
            description: 'Search for a song on Spotify!',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'song',
                    description: 'The song\'s name to search for.',
                    required: true
                }
            ]
        };

        super(sc, { defer: true });
    }

    async init(interaction: ChatInputCommandInteraction) {
        let search = interaction.options.getString('song');
        if (!search && interaction.member instanceof GuildMember) {
            const p = interaction.member.presence?.activities.find(
                a => a.type === 'LISTENING' && a.name === 'Spotify'
            );

            if (p) {
                search = `${p.details}${p.state ? ` - ${p.state}` : ''}`
            }
        }

        if (typeof search !== 'string') {
            return '❌ If you are not listening to any songs, a search query must be provided!';
        }

        const res = await spotify.search(search);

        if (res.tracks.items.length === 0) {
            return '❌ No songs found!';
        }

        const image = res.tracks.items[0].album.images.reduce((a, b) => {
            return a.height > b.height ? a : b;
        }, { height: 0, width: 0, url: '' });

        let desc = res.tracks.items[0].preview_url
            ? `${hyperlink('Song Preview', res.tracks.items[0].preview_url)}\n`
            : '';

        for (const track of res.tracks.items) {
            const artistNames = track.artists
                .map(a => a.name)
                .join(' and ')
                .trim();

            const line = `[${track.name}](${track.external_urls.spotify}) by ${inlineCode(artistNames)}\n`;
            
            if (desc.length + line.length > 2048) break;

            desc += line;
        }

        return Embed.ok()
            .setDescription(desc)
            .setThumbnail(image.url);
    }
} 
import { Interactions } from '#khaf/Interaction';
import { badmeme, cache } from '@khaf/badmeme';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ChatInputCommandInteraction } from 'discord.js';

export class kInteraction extends Interactions {
    constructor () {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'badmeme',
            description: 'Get a horrible meme!',
            options: [
                {
                    // see https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-type
                    type: ApplicationCommandOptionType.String,
                    name: 'subreddit',
                    description: 'Subreddit to get a bad meme on.'
                }
            ]
        };

        super(sc);
    }

    async init (interaction: ChatInputCommandInteraction): Promise<string> {
        const subreddit = interaction.options.getString('subreddit') ?? 'dankmemes';

        if (!cache.has(subreddit))
            await interaction.deferReply();

        const item = await badmeme(subreddit, false);

        if (item === null) {
            return '❌ No posts in this subreddit were found. This command does not post NSFW images.';
        } else if ('error' in item) {
            if (item.error === 404) {
                return '❌ That subreddit doesn\'t exist!';
            }

            switch (item.reason) {
                case 'banned': return '❌ Subreddit is banned!';
                case 'private': return '❌ Subreddit is set as private!';
                case 'quarantined': return '❌ Subreddit is quarantined!';
                default: return `❌ Subreddit is blocked for reason "${item.reason}"!`;
            }
        } else if (item.url.length === 0) {
            return '❌ No valid posts in this subreddit!';
        }

        return Array.isArray(item.url) ? item.url[0] : item.url;
    }
}
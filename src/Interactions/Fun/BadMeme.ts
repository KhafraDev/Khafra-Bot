import { Interactions } from '#khaf/Interaction';
import { badmeme, cache, SortBy, Timeframe } from '@khaf/badmeme';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ChatInputCommandInteraction, TextChannel } from 'discord.js';

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
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'sort-by',
                    description: 'Sort posts by the given modifier.',
                    choices: Object.values(SortBy).map(
                        choice => ({ name: choice, value: choice })
                    )
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'timeframe',
                    description: 'Timeframe to sort posts by (only if "sort-by" is top).',
                    choices: Object.values(Timeframe).map(
                        choice => ({ name: choice, value: choice })
                    )
                }
            ]
        };

        super(sc);
    }

    async init (interaction: ChatInputCommandInteraction): Promise<string> {
        const subreddit =
            interaction.options.getString('subreddit')?.toLowerCase() ??
            'dankmemes';
        const modifier = interaction.options.getString('sort-by') as `${SortBy}` | null;
        const timeframe = modifier === 'top'
            ? interaction.options.getString('timeframe') as `${Timeframe}` | null
            : undefined

        if (!cache.has(subreddit))
            await interaction.deferReply();

        const isNSFW = Boolean((interaction.channel as TextChannel | null)?.nsfw);
        const item = await badmeme(
            subreddit,
            isNSFW,
            modifier ?? undefined,
            timeframe ?? undefined
        );

        if (item === null) {
            const nsfwWarning = interaction.channel !== null && !isNSFW
                ? ' NSFW subreddits do not work in age restricted channels!'
                : '';

            return `❌ No posts in this subreddit were found.${nsfwWarning}`;
        } else if ('error' in item) {
            if (item.error === 404) {
                return '❌ This subreddit doesn\'t exist!';
            }

            switch (item.reason) {
                case 'banned': return '❌ Subreddit is banned!';
                case 'private': return '❌ Subreddit is set as private!';
                case 'quarantined': return '❌ Subreddit is quarantined!';
                default: return `❌ Subreddit is blocked for reason "${item.reason}"!`;
            }
        } else if (item.url.length === 0) {
            return '❌ The requested post was filtered incorrectly.';
        }

        return Array.isArray(item.url) ? item.url[0] : item.url;
    }
}
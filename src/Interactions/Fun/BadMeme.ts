import { Interactions } from '#khaf/Interaction';
import { badmeme, cache, SortBy, Timeframe } from '@khaf/badmeme';
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ApplicationCommandOptionType } from 'discord-api-types/v10';
import type { ChatInputCommandInteraction, InteractionReplyOptions, TextChannel } from 'discord.js';

const getReasonString = (reason: string): string => {
    switch (reason) {
        case 'banned': return '❌ Subreddit is banned!';
        case 'private': return '❌ Subreddit is set as private!';
        case 'quarantined': return '❌ Subreddit is quarantined!';
        default: return `❌ Subreddit is blocked for reason "${reason}"!`;
    }
}

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

    async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const subreddit =
            interaction.options.getString('subreddit')?.toLowerCase() ??
            'dankmemes';
        const modifier = interaction.options.getString('sort-by') as typeof SortBy[keyof typeof SortBy] | null;
        const timeframe = modifier === 'top'
            ? interaction.options.getString('timeframe') as typeof Timeframe[keyof typeof Timeframe] | null
            : undefined;

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

            return {
                content: `❌ No posts in this subreddit were found.${nsfwWarning}`,
                ephemeral: true
            }
        } else if ('error' in item) {
            if (item.error === 404) {
                return {
                    content: '❌ This subreddit doesn\'t exist!',
                    ephemeral: true
                }
            }

            return {
                content: getReasonString(item.reason as string)
            }
        } else if (item.url.length === 0) {
            return {
                content: '❌ The requested post was filtered incorrectly.',
                ephemeral: true
            }
        }

        return {
            content: Array.isArray(item.url) ? item.url[0] : item.url
        }
    }
}
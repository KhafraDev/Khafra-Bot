import { badmeme, cache } from '@khaf/badmeme';
import { CommandInteraction } from 'discord.js';
import { RegisterInteraction } from '../../Structures/Decorator.js';
import { Interactions } from '../../Structures/Interaction.js';

@RegisterInteraction
export class kInteraction extends Interactions {
    constructor() {
        super({
            type: 'STRING',
            name: 'badmeme',
            description: 'Get a horrible meme',
            options: [{
                name: 'subreddit',
                type: 'STRING',
                description: 'Subreddit to get a bad meme on!',
                required: false
            }]
        });
    }

    async init(interaction: CommandInteraction) {
        const subreddit = interaction.options.size === 0
            ? 'dankmemes'
            : `${interaction.options.first()!.value}`.toLowerCase();

        if (!cache.has(subreddit))
            await interaction.defer();

        const item = await badmeme(subreddit, false);

        if (item === null)
            return '❌ No posts in this subreddit were found. This command doesn\'t work on NSFW subreddits!';
        else if ('error' in item) {
            if (item.reason === 'private')
                return '❌ Subreddit is set as private!';
            else if (item.reason === 'banned') // r/the_donald
                return '❌ Subreddit is banned!';
            else if (item.reason === 'quarantined') // r/spacedicks (all others are just banned now)
                return '❌ Subreddit is quarantined!';
                
            return `❌ Subreddit is blocked for reason "${item.reason}"!`;
        } else if (item.url.length === 0)
            return '❌ No valid posts in this subreddit!';

        return Array.isArray(item.url) ? item.url[0] : item.url;
    }
} 
import { CommandInteraction } from 'discord.js';
import { Interactions } from '../../Structures/Interaction.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';
import { URLFactory } from '../../lib/Utility/Valid/URL.js';
import { getTwitterMediaURL } from '../../lib/Packages/Twitter.js';

export class kInteraction extends Interactions {
    constructor() {
        const sc = new SlashCommandBuilder()
            .setName('twitter')
            .addStringOption(option => option
                .setName('twitter')
                .setDescription('Twitter URL to get media of')
                .setRequired(true)
            )
            .setDescription('Get a list of media embedded in a Tweet!');

        super(sc, { defer: true });
    }

    async init(interaction: CommandInteraction) {
        const url = interaction.options.getString('twitter', true);
        const { hostname, pathname } = URLFactory(url) ?? {};

        if (hostname !== 'twitter.com' || !pathname)
            return '❌ Not a Twitter status!';
        // Your username can only contain letters, numbers and '_'
        // Your username must be shorter than 15 characters.
        else if (!/\/[A-z0-9_]{3,15}\/status\/\d{17,19}$/.test(pathname ?? ''))
            return `❌ Invalid Twitter status!`;

        const id = /\/(\d+)$/.exec(pathname)![1];
        const media = await getTwitterMediaURL(id);

        if (!media)
            return '❌ No media found in Tweet!';
            
        return Embed.success(media);
    }
} 
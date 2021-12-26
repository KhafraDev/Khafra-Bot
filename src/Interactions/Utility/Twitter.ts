import { CommandInteraction } from 'discord.js';
import { Interactions } from '#khaf/Interaction';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { URLFactory } from '#khaf/utility/Valid/URL.js';
import { getTwitterMediaURL } from '#khaf/utility/commands/Twitter';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'twitter',
            description: 'Gets a list of media embedded in a tweet!',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'tweet',
                    description: 'Twitter URL to get the media of.',
                    required: true
                }
            ]
        };

        super(sc, { defer: true });
    }

    async init(interaction: CommandInteraction) {
        const url = interaction.options.getString('tweet', true);
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
            
        return Embed.ok(media);
    }
} 
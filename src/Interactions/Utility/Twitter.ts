import { Interactions } from '#khaf/Interaction';
import { getTwitterMediaURL } from '#khaf/utility/commands/Twitter';
import { Components } from '#khaf/utility/Constants/Components.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { URLFactory } from '#khaf/utility/Valid/URL.js';
import { ActionRow, MessageActionRowComponent } from '@discordjs/builders';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';

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

    async init(interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const url = interaction.options.getString('tweet', true);
        const twitterURL = URLFactory(url);

        if (!twitterURL || twitterURL.hostname !== 'twitter.com' || !twitterURL.pathname) {
            return {
                content: '❌ Not a Twitter status!',
                ephemeral: true
            }
        }

        // Your username can only contain letters, numbers and '_'
        // Your username must be shorter than 15 characters.
        if (!/\/[A-z0-9_]{3,15}\/status\/\d{17,19}$/.test(twitterURL.pathname)) {
            return {
                content: '❌ Invalid Twitter status!',
                ephemeral: true
            }
        }

        const id = /\/(\d+)$/.exec(twitterURL.pathname)![1];
        const media = await getTwitterMediaURL(id);

        if (!media) {
            return {
                content: '❌ No media found in Tweet!',
                ephemeral: true
            }
        }

        return {
            embeds: [Embed.ok(media)],
            components: [
                new ActionRow<MessageActionRowComponent>().addComponents(
                    Components.link('Go to Twitter', twitterURL.toString())
                )
            ]
        }
    }
}
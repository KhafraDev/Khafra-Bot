import { Interactions } from '#khaf/Interaction';
import { inlineCode } from '@discordjs/builders';
import { NASAGetRandom } from '#khaf/utility/commands/NASA';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import type { InteractionReplyOptions } from 'discord.js';

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'nasa',
            description: 'Gets a random image of space from NASA!'
        };

        super(sc, { defer: true });
    }

    async init (): Promise<InteractionReplyOptions> {
        const [err, result] = await dontThrow(NASAGetRandom());

        if (err !== null) {
            return {
                content: `❌ An unexpected error occurred: ${inlineCode(err.message)}`,
                ephemeral: true
            }
        } else if (result === null) {
            return {
                content: '❌ No images were fetched, try again?',
                ephemeral: true
            }
        }

        const embed = Embed.ok()
            .setTitle(result.title)
            .setURL(result.link)
            .setImage(result.link);

        if (typeof result.copyright === 'string') {
            embed.setFooter({ text: `© ${result.copyright}` });
        }

        return {
            embeds: [embed]
        }
    }
}
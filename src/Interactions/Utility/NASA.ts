import { Interactions } from '#khaf/Interaction';
import { inlineCode, type UnsafeEmbed as MessageEmbed } from '@discordjs/builders';
import { NASAGetRandom } from '#khaf/utility/commands/NASA';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'nasa',
            description: 'Gets a random image of space from NASA!'
        };

        super(sc, { defer: true });
    }

    async init (): Promise<string | MessageEmbed> {
        const [err, result] = await dontThrow(NASAGetRandom());

        if (err !== null) {
            return `❌ An unexpected error occurred: ${inlineCode(err.message)}`;
        } else if (result === null) {
            return '❌ No images were fetched, try again?';
        }

        const embed = Embed.ok()
            .setTitle(result.title)
            .setURL(result.link)
            .setImage(result.link);

        if (typeof result.copyright === 'string') {
            embed.setFooter({ text: `© ${result.copyright}` });
        }

        return embed;
    }
}
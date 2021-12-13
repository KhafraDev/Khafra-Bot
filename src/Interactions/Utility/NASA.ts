import { Interactions } from '../../Structures/Interaction.js';
import { inlineCode } from '@khaf/builders';
import { NASAGetRandom } from '../../lib/Packages/NASA.js';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';
import { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'nasa',
            description: 'Gets a random image of space from NASA!'
        };

        super(sc, { defer: true });
    }

    async init() {
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
            embed.setFooter(`© ${result.copyright}`);
        }

        return embed;
    }
} 
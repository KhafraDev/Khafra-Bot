import { client } from '#khaf/Client';
import { Interactions } from '#khaf/Interaction';
import { cwd } from '#khaf/utility/Constants/Path.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { stripIndents } from '#khaf/utility/Template.js';
import { hideLinkEmbed, hyperlink, inlineCode } from '@khaf/builders';
import { fetchMDN } from '@khaf/mdn';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { ChatInputCommandInteraction } from 'discord.js';
import { join } from 'path';

const config = createFileWatcher({} as typeof import('../../../config.json'), join(cwd, 'config.json'));

const emoji = client.emojis.cache.get(config.interactions.mdn);

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'mdn',
            description: 'Searches MDN and returns the top result!',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'input',
                    description: 'Search query to search for.',
                    required: true
                }
            ]
        };

        super(sc, { defer: true });
    }

    async init(interaction: ChatInputCommandInteraction) {
        const search = interaction.options.getString('input', true);            
        const result = await fetchMDN(search);

        if ('errors' in result) {
            const keys = Object.keys(result.errors);
            return `${emoji} ${keys.map(k => result.errors[k].map(e => e.message).join('\n')).join('\n')}`;
        }

        if (result.documents.length === 0)
            return `${emoji} No search results found!`;

        const document = result.documents[0]!;

        const hy = hyperlink(
            document.title,
            hideLinkEmbed(`https://developer.mozilla.org/${document.locale}/docs/${document.slug}`)
        );

        return stripIndents`    
        ${emoji ?? 'MDN'} ${hy}
        ${inlineCode(document.summary.replace(/\s+/g, ' '))}
        `;
    }
} 
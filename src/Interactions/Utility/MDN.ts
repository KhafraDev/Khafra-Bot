import { CommandInteraction } from 'discord.js';
import { fetchMDN } from '@khaf/mdn';
import { client } from '../../index.js';
import { stripIndents } from '../../lib/Utility/Template.js';
import { Interactions } from '../../Structures/Interaction.js';
import { createFileWatcher } from '../../lib/Utility/FileWatcher.js';
import { cwd } from '../../lib/Utility/Constants/Path.js';
import { join } from 'path';
import { hideLinkEmbed, hyperlink, inlineCode, SlashCommandBuilder } from '@discordjs/builders';

const config = createFileWatcher({} as typeof import('../../../config.json'), join(cwd, 'config.json'));

const emoji = client.emojis.cache.get(config.interactions.mdn);

export class kInteraction extends Interactions {
    constructor() {
        const sc = new SlashCommandBuilder()
            .setName('mdn')
            .addStringOption(option => option
                .setName('input')
                .setDescription('Your search query on MDN')
                .setRequired(true)    
            )
            .setDescription('Searches MDN and returns the top result!');

        super(sc, { defer: true });
    }

    async init(interaction: CommandInteraction) {
        const search = interaction.options.get('input', true).value;
        if (typeof search !== 'string')
            return 'Invalid option received!';
            
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
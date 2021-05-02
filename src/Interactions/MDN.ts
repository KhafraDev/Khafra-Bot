import { ApplicationCommandOption, CommandInteraction } from 'discord.js';
import { fetchMDN } from 'search-mdn';
import { client } from '../index.js';
import { stripIndents } from '../lib/Utility/Template.js';
import { RegisterInteraction } from '../Structures/Decorator.js';
import { Interactions } from '../Structures/Interaction.js';

// TODO(@KhafraDev): read this id from a config file
const emoji = client.emojis.cache.get('828993033306505218');

@RegisterInteraction
export class kInteraction extends Interactions {
    data: ApplicationCommandOption = {
        type: 'STRING',
        name: 'mdn',
        description: 'Searches MDN and returns the top result!',
        options: [{
            name: 'input',
            type: 'STRING',
            description: 'Your search query on MDN',
            required: true
        }]
    };
    options = {
        defer: true
    }

    async init(interaction: CommandInteraction) {
        const search = interaction.options[0].value! as string;
        const result = await fetchMDN(search);

        if ('errors' in result) {
            const keys = Object.keys(result.errors);
            return `${emoji} ${keys.map(k => result.errors[k].map(e => e.message).join('\n')).join('\n')}`;
        }

        if (result.documents.length === 0)
            return `${emoji} No search results found!`;

        const document = result.documents[0]!;

        return stripIndents`    
        ${emoji} [${document.title}](<https://developer.mozilla.org/${document.locale}/docs/${document.slug}>)
        \`\`${document.summary.replace(/\s+/g, ' ')}\`\`
        `;
    }
}
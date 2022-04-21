import { client } from '#khaf/Client';
import { Interactions } from '#khaf/Interaction';
import { Buttons, Components } from '#khaf/utility/Constants/Components.js';
import { cwd } from '#khaf/utility/Constants/Path.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { stripIndents } from '#khaf/utility/Template.js';
import { hideLinkEmbed, hyperlink, inlineCode } from '@discordjs/builders';
import { fetchMDN } from '@khaf/mdn';
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ApplicationCommandOptionType } from 'discord-api-types/v10';
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import { join } from 'node:path';

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

    async init(interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const search = interaction.options.getString('input', true);
        const result = await fetchMDN(search);

        if ('errors' in result) {
            const keys = Object.keys(result.errors);
            return {
                content: `${emoji} ${keys.map(k => result.errors[k].map(e => e.message).join('\n')).join('\n')}`
            }
        }

        if (result.documents.length === 0) {
            return {
                content: `${emoji} No search results found!`,
                ephemeral: true
            }
        }

        const document = result.documents[0]!;
        const link = `https://developer.mozilla.org/${document.locale}/docs/${document.slug}`;

        return {
            content: stripIndents`    
            ${emoji ?? 'MDN'} ${hyperlink(document.title, hideLinkEmbed(link))}
            ${inlineCode(document.summary.replace(/\s+/g, ' '))}`,
            components: [
                Components.actionRow([
                    Buttons.link('Go to MDN', link)
                ])
            ]
        }
    }
}
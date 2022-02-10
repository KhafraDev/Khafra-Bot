import { Interactions } from '#khaf/Interaction';
import { Components } from '#khaf/utility/Constants/Components.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { ActionRow, bold, hyperlink, inlineCode, time } from '@khaf/builders';
import { npm } from '@khaf/npm';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'npm',
            description: 'Gets the information about a package on NPM.',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'name',
                    description: 'NPM package to get information about.',
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'version',
                    description: 'Package version to get, defaults to the latest.'
                }
            ]
        };

        super(sc, { defer: true });
    }

    async init(interaction: ChatInputCommandInteraction): Promise<string | InteractionReplyOptions> {
        const name = interaction.options.getString('name', true);
        const version = interaction.options.getString('version') ?? 'latest';
        const p = await npm(name);

        if ('code' in p) {
            return '❌ No package with that name was found!';
        } else if ('error' in p) {
            return `❌ An unexpected error has occurred: ${inlineCode(p.error)}!`;
        }

        const ver = version.startsWith('v') ? version.slice(1) : version;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        const dist = p.versions[p['dist-tags'][ver] ?? p['dist-tags']['latest']];
        const link = `https://npmjs.com/package/${dist.name}`;
        const maintainers = dist.maintainers
            .slice(0, 10)
            .map(u => u.name)
            .join(', ');

        const embed = Embed.ok()
            .setAuthor({
                name: 'NPM',
                iconURL: 'https://avatars0.githubusercontent.com/u/6078720?v=3&s=400',
                url: 'https://npmjs.com/'
            })
            .setDescription(`
            ${hyperlink(dist.name, link)}
            ${inlineCode(p.description.slice(0, 2000))}
            `)
            .addField({ name: bold('Version:'), value: dist.version, inline: true })
            .addField({ name: bold('License:'), value: dist.license, inline: true })
            .addField({ name: bold('Author:'), value: p.author?.name ?? 'N/A', inline: true })
            .addField({
                name: bold('Last Modified:'),
                value: time(new Date(p.time?.modified ?? Date.now()), 'f'),
                inline: true
            })
            .addField({ name: bold('Published:'), value: time(new Date(p.time?.created ?? Date.now())), inline: true })
            .addField({ name: bold('Homepage:'), value: p.homepage ?? 'None', inline: true })
            .addField({ name: bold('Maintainers:'), value: maintainers });

        return {
            embeds: [ embed ],
            components: [
                new ActionRow().addComponents(
                    Components.link('Go to npm', link)
                )
            ]
        } as InteractionReplyOptions;
    }
} 
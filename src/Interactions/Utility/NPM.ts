import { Interactions } from '#khaf/Interaction';
import { Buttons, Components } from '#khaf/utility/Constants/Components.js';
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js';
import { bold, hyperlink, inlineCode, time } from '@discordjs/builders';
import { npm } from '@khaf/npm';
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ApplicationCommandOptionType } from 'discord-api-types/v10';
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';

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

    async init(interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const name = interaction.options.getString('name', true);
        const version = interaction.options.getString('version') ?? 'latest';
        const p = await npm(name);

        if ('code' in p) {
            return {
                content: '❌ No package with that name was found!',
                ephemeral: true
            }
        } else if ('error' in p) {
            return {
                content: `❌ An unexpected error has occurred: ${inlineCode(p.error)}!`,
                ephemeral: true
            }
        }

        const ver = version.startsWith('v') ? version.slice(1) : version;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        const dist = p.versions[p['dist-tags'][ver] ?? p['dist-tags']['latest']];
        const link = `https://npmjs.com/package/${dist.name}`;
        const maintainers = dist.maintainers
            .slice(0, 10)
            .map(u => u.name)
            .join(', ');

        const embed = Embed.json({
            color: colors.ok,
            author: {
                name: 'NPM',
                icon_url: 'https://avatars0.githubusercontent.com/u/6078720?v=3&s=400',
                url: 'https://npmjs.com/'
            },
            description: `
            ${hyperlink(dist.name, link)}
            ${inlineCode(p.description.slice(0, 2000))}
            `,
            fields: [
                { name: bold('Version:'), value: dist.version, inline: true },
                { name: bold('License:'), value: dist.license, inline: true },
                { name: bold('Author:'), value: p.author?.name ?? 'N/A', inline: true },
                {
                    name: bold('Last Modified:'),
                    value: time(new Date(p.time?.modified ?? Date.now()), 'f'),
                    inline: true
                },
                { name: bold('Published:'), value: time(new Date(p.time?.created ?? Date.now())), inline: true },
                { name: bold('Homepage:'), value: p.homepage ?? 'None', inline: true },
                { name: bold('Maintainers:'), value: maintainers }
            ]
        });

        return {
            embeds: [embed],
            components: [
                Components.actionRow([
                    Buttons.link('Go to npm', link)
                ])
            ]
        }
    }
}
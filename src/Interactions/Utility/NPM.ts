import { ChatInputCommandInteraction } from 'discord.js';
import { Interactions } from '#khaf/Interaction';
import { bold, inlineCode, time } from '@khaf/builders';
import { npm } from '@khaf/npm';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';

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

    async init(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name', true);
        const version = interaction.options.getString('version') ?? 'latest';
        const p = await npm(name);

        if ('code' in p) {
            return '❌ No package with that name was found!';
        } else if ('error' in p) {
            return `❌ An unexpected error has occurred: ${inlineCode(p.error)}!`;
        }

        const dist = p.versions[p['dist-tags'][version]];
        const maintainers = dist.maintainers
            .slice(0, 10)
            .map(u => u.name)
            .join(', ');

        return Embed.ok()
            .setAuthor({
                name: 'NPM',
                iconURL: 'https://avatars0.githubusercontent.com/u/6078720?v=3&s=400',
                url: 'https://npmjs.com/'
            })
            .setDescription(`
            [${dist.name}](https://npmjs.com/package/${dist.name})
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
            .addField({ name: bold('Maintainers:'), value: maintainers })
    
    }
} 
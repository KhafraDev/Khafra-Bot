import { CommandInteraction } from 'discord.js';
import { Interactions } from '../../Structures/Interaction.js';
import { bold, inlineCode, time } from '@discordjs/builders';
import { npm } from '@khaf/npm';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';
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

    async init(interaction: CommandInteraction) {
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

        return Embed.success()
            .setAuthor('NPM', 'https://avatars0.githubusercontent.com/u/6078720?v=3&s=400', 'https://npmjs.com/')
            .setDescription(`
            [${dist.name}](https://npmjs.com/package/${dist.name})
            ${inlineCode(p.description.slice(0, 2000))}
            `)
            .addField(bold('Version:'), dist.version, true)
            .addField(bold('License:'), dist.license, true)
            .addField(bold('Author:'), p.author?.name ?? 'N/A', true)
            .addField(bold('Last Modified:'), time(new Date(p.time?.modified ?? Date.now()), 'f'), true)
            .addField(bold('Published:'), time(new Date(p.time?.created ?? Date.now())), true)
            .addField(bold('Homepage:'), p.homepage ?? 'None', true)
            .addField(bold('Maintainers:'), maintainers, false)
    
    }
} 
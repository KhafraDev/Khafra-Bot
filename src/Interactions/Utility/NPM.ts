import { CommandInteraction } from 'discord.js';
import { Interactions } from '../../Structures/Interaction.js';
import { bold, inlineCode, SlashCommandBuilder, time } from '@discordjs/builders';
import { npm } from '@khaf/npm';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';

export class kInteraction extends Interactions {
    constructor() {
        const sc = new SlashCommandBuilder()
            .setName('npm')
            .addStringOption(option => option
                .setName('name')
                .setDescription('NPM package to get info about.')
                .setRequired(true)
            )
            .addStringOption(option => option
                .setName('version')
                .setDescription('Package version to get (defaults to latest).')
                .setRequired(false)    
            )
            .setDescription('Get information about a package on NPM!');

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
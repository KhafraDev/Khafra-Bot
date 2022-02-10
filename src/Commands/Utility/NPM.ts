import { Arguments, Command } from '#khaf/Command';
import { bold, inlineCode, time, type Embed } from '@khaf/builders';
import { npm } from '@khaf/npm';
import { Message } from 'discord.js';

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Search NPM\'s registry for a package',
                'node-fetch latest', 'typescript'
            ],
			{
                name: 'npm',
                folder: 'Utility',
                aliases: [ 'npmjs' ],
                args: [1, 2]
            }
        );
    }

    async init (_message: Message, { args }: Arguments): Promise<string | Embed> {
        const [name, version = 'latest'] = args;
        const p = await npm(name);

        if ('code' in p) {
            return '❌ No package with that name was found!';
        } else if ('error' in p) {
            return `❌ An unexpected error has occurred: ${inlineCode(p.error)}!`;
        }

        const ver = version.startsWith('v') ? version.slice(1) : version;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        const dist = p.versions[p['dist-tags'][ver] ?? p['dist-tags']['latest']];

        const maintainers = dist.maintainers
            .slice(0, 10)
            .map(u => u.name)
            .join(', ');

        return this.Embed.ok()
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
            .addField({ name: bold('Maintainers:'), value: maintainers });
    }
}
import { Command, Arguments } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { npm } from '@khaf/npm';
import { bold, inlineCode, time } from '@khaf/builders';

export class kCommand extends Command {
    constructor() {
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

    async init(_message: Message, { args }: Arguments) {
        const _package = await npm(args[0]);

        if ('code' in _package) {
            return this.Embed.fail('No package with that name was found!');
        } else if ('error' in _package) {
            return this.Embed.fail(`Received error ${inlineCode(_package.error)}.`);
        }

        const dist = _package.versions[_package['dist-tags'][args[1] ?? 'latest']];
        return this.Embed.success()
            .setAuthor('NPM', 'https://avatars0.githubusercontent.com/u/6078720?v=3&s=400', 'https://npmjs.com/')
            .setDescription(`
            [${dist.name}](https://npmjs.com/package/${dist.name})
            ${inlineCode(_package.description.slice(0, 2000))}
            `)
            .addField(bold('Version:'), dist.version, true)
            .addField(bold('License:'), dist.license, true)
            .addField(bold('Author:'), _package.author?.name ?? 'N/A', true)
            .addField(bold('Last Modified:'), time(new Date(_package.time?.modified ?? Date.now()), 'f'), true)
            .addField(bold('Published:'), time(new Date(_package.time?.created ?? Date.now())), true)
            .addField(bold('Homepage:'), _package.homepage ?? 'None', true)
            .addField(bold('Maintainers:'), dist.maintainers.slice(0, 10).map(u => u.name).join(', '), false)
    }
}
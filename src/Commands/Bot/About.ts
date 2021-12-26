import { Command } from '#khaf/Command';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { cwd } from '#khaf/utility/Constants/Path.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { bold } from '@khaf/builders';
import { version } from 'discord.js';
import { join } from 'path';

const pkg = createFileWatcher({} as typeof import('../../../package.json'), join(cwd, 'package.json'));

export class kCommand extends Command {
    constructor() {
        super([
            'Basic information about the bot.'
        ], {
            name: 'about',
            folder: 'Bot',
            args: [0, 0],
            ratelimit: 3
        });
    }

    async init() {
        const memoryMB = process.memoryUsage().heapUsed / 2 ** 20; // same as 1024 * 1024

        return Embed.ok()
            .setDescription(`
            ${bold('Dependencies')}
            ${Object.keys(pkg.dependencies).map(k => `[${k}](https://npmjs.com/package/${k})`).join(', ')}
            `)
            .addField(bold('Memory'), `${memoryMB.toFixed(2)} MB`, false)
            .addField(bold('Khafra-Bot:'), `v${pkg.version}`, true)
            .addField(bold('Discord.js'), `v${version}`, true)
            .addField(bold('NodeJS'), process.version, true);
    }
}
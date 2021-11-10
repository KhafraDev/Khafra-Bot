import { version } from 'discord.js';
import { Command } from '../../Structures/Command.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { createFileWatcher } from '../../lib/Utility/FileWatcher.js';
import { cwd } from '../../lib/Utility/Constants/Path.js';
import { join } from 'path';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';
import { bold } from '@khaf/builders';

const pkg = createFileWatcher({} as typeof import('../../../package.json'), join(cwd, 'package.json'));

@RegisterCommand
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

    init() {
        const memoryMB = process.memoryUsage().heapUsed / 2 ** 20; // same as 1024 * 1024

        return Embed.success()
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
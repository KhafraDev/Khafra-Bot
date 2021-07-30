import { version } from 'discord.js';
import { Command } from '../../Structures/Command.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { createFileWatcher } from '../../lib/Utility/FileWatcher.js';
import { cwd } from '../../lib/Utility/Constants/Path.js';
import { join } from 'path';

const pkg = {} as typeof import('../../../package.json');
createFileWatcher(pkg, join(cwd, 'package.json'));

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

        return this.Embed.success()
            .setDescription(`
            **Dependencies:**
            ${Object.keys(pkg.dependencies).map(k => `[${k}](https://npmjs.com/package/${k})`).join(', ')}
            `)
            .addField('**Memory**', `${memoryMB.toFixed(2)} MB`, false)
            .addField(`**Khafra-Bot:**`, `v${pkg.version}`, true)
            .addField('**Discord.js**', `v${version}`, true)
            .addField('**NodeJS**', process.version, true);
    }
}
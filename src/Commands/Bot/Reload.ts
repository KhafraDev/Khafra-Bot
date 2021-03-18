import { Message } from 'discord.js';
import { Command } from '../../Structures/Command.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { stat } from 'fs/promises';
import { fileURLToPath, pathToFileURL } from 'url';
import { KhafraClient } from '../../Bot/KhafraBot.js';
import { upperCase } from '../../lib/Utility/String.js';

const isPrototypeOf = Object.prototype.isPrototypeOf.bind(Command);

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super([
            'Reload a command. ' + 
            'You must provide the path from the base directory as Khafra-Bot does not retain references to command locations in the file system.',
            'build/src/Commands/Fun/Bible.js'
        ], {
            name: 'reload',
            folder: 'Bot',
            args: [1],
            ownerOnly: true,
            errors: {
                Error: 'File does not exist!'
            }
        });
    }

    async init(_message: Message, args: string[]) {
        const { href } = pathToFileURL(args[0]);
        const path = fileURLToPath(href);
        
        /**
         * I'm not entirely sure if this is even the best way of checking
         * for the existence of a file, but it would appear as though no one
         * else knows either.
         */
        const exists = (await stat(path)).isFile();
        if (!exists) 
            return this.Embed.fail(`\`${href}\` is not a file!`);
        
        // all commands have similar exports, so any command will do
        const { kCommand } = await import(href) as typeof import('./Reload.js');
        if (!isPrototypeOf(kCommand))
            return this.Embed.fail('Invalid path imported: does not have a named export `kCommand`!');

        // instantiate new instance, remove aliases+name from command cache
        // this DOES NOT cause the decorator to fire again!
        const cmd = new kCommand();
        KhafraClient.Commands.delete(cmd.settings.name.toLowerCase());
        cmd.settings.aliases.forEach(a => KhafraClient.Commands.delete(a));

        // now we will mirror the decorator function for the most part
        // we might want to run the middleware in the future, but not for now
        KhafraClient.Commands.set(cmd.settings.name.toLowerCase(), cmd);
        cmd.settings.aliases.forEach(alias => KhafraClient.Commands.set(alias, cmd));

        if (cmd.help.length < 2) // fill array to min length 2
            cmd.help = [...cmd.help, ...Array<string>(2 - cmd.help.length).fill('')];

        return this.Embed.success(`
        Reloaded command ${upperCase(cmd.settings.name)} from ${path}!
        `);
    }
}
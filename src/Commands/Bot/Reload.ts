// This command is a beast.

import { Message } from 'discord.js';
import { readdir } from 'fs/promises';
import { join, parse, sep } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { KhafraClient } from '../../Bot/KhafraBot.js';
import { client } from '../../index.js';
import { compile } from '../../lib/Packages/Compile.js';
import { compareTwoStrings } from '../../lib/Utility/CompareStrings.js';
import { Command, Arguments } from '../../Structures/Command.js';
import { CommandCooldown } from '../../Structures/Cooldown/CommandCooldown.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

const basePath = join(process.cwd(), 'src/Commands');

// https://github.com/nodejs/help/issues/2806#issuecomment-650653295
// The ESM cache is not exposed, unlike `require.cache`, so commands
// cannot be reloaded. However, new commands can still be loaded with this.

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super([
            'Reloads a command without needing to restart.'
        ], {
            name: 'reload',
            folder: 'Bot',
            args: [2, 2],
            ratelimit: 0,
            ownerOnly: true
        });
    }

    async init(message: Message, { args }: Arguments) {
        // on Linux (and possibly other OSes), capitalization in directory paths
        // does matter, but does not on Windows. This will get the correct folder capitalization.
        const dir = await readdir(join(fileURLToPath(import.meta.url), '../..'));
        const closest = dir
            .sort((a, b) => 
                compareTwoStrings(b.toLowerCase(), args[0].toLowerCase()) 
                - compareTwoStrings(a.toLowerCase(), args[0].toLowerCase())
            )
            .shift();
        
        const files = await client.walk(join(basePath, closest), () => true);
        const mapped = files
            .map(p => parse(p))
            .map(p => ({ 
                dir: p.dir, 
                base: p.base, 
                similarity: compareTwoStrings(p.base.toLowerCase(), args[1].toLowerCase()) }
            ))
            .sort((a, b) => b.similarity - a.similarity);

        let description = '';
        for (const item of mapped) {
            const str = `${item.base} - ${(item.similarity * 100).toFixed(2)}%\n`;
            if (description.length + str.length > 2048) break;
            description += str;
        }

        const m = await message.reply({ embeds: [this.Embed
            .success(description)
            .setTitle('Which file should be reloaded?')
        ]});

        const c = await m.channel.awaitMessages(
            (msg: Message) => mapped.some(({ base }) => base === msg.content),
            { max: 1, time: 30000 }
        );

        if (c.size === 0)
            return this.Embed.fail('Command canceled!');

        const cmd = mapped.find(({ base }) => base === c.first().content);
        const outDir = cmd.dir.replace(`${sep}src${sep}`, `${sep}build${sep}src${sep}`);

        const compiled = compile(
            [ join(cmd.dir, cmd.base) ],
            { outDir: join(process.cwd(), 'build') }
        );

        await m.edit({ embeds: [this.Embed.success(compiled.join('\n').slice(0, 2048))] }); 

        const { href } = pathToFileURL(join(outDir, cmd.base.replace(/\.(.*?)$/, '.js')));
        const { kCommand } = await import(href) as typeof import('./Reload');
        const command = new kCommand();
        const commandName = command.settings.name.toLowerCase();

        KhafraClient.Commands.delete(commandName); // remove from command cache
        CommandCooldown.delete(commandName); // remove from individual command cooldown
        KhafraClient.Commands.set(commandName, command); // add back to cache
        CommandCooldown.set(commandName, new Set()); // add back to cache

        command.settings.aliases.forEach(alias => KhafraClient.Commands.set(alias, command));

        if (command.help.length < 2) // fill array to min length 2
            command.help = [...command.help, ...Array<string>(2 - command.help.length).fill('')];
    }
}
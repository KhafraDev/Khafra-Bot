import { Command } from '#khaf/Command';
import { Event } from '#khaf/Event';
import { Interactions, InteractionSubCommand } from '#khaf/Interaction';
import { bright, green, magenta } from '#khaf/utility/Colors.js';
import { assets, cwd } from '#khaf/utility/Constants/Path.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { once } from '#khaf/utility/Memoize.js';
import { Minimalist } from '#khaf/utility/Minimalist.js';
import { REST } from '@discordjs/rest';
import { APIApplicationCommand, APIVersion, Routes } from 'discord-api-types/v9';
import { Client, ClientEvents } from 'discord.js';
import { existsSync, writeFileSync } from 'fs';
import { readdir, readFile, stat } from 'fs/promises';
import { join, resolve } from 'path';
import { performance } from 'perf_hooks';
import { argv, env } from 'process';
import { pathToFileURL } from 'url';

type DynamicImportCommand = Promise<{ kCommand: new (...args: unknown[]) => Command }>;
type DynamicImportEvent = Promise<{ kEvent: new (...args: unknown[]) => Event }>;
type DynamicImportAppCommand = Promise<{
    kInteraction: new () => Interactions
} | {
    kSubCommand: new () => InteractionSubCommand
}>;

const config = createFileWatcher({} as typeof import('../../config.json'), join(cwd, 'config.json'));
const toBase64 = (command: unknown) => Buffer.from(JSON.stringify(command)).toString('base64');

export class KhafraClient extends Client {
    static Commands: Map<string, Command> = new Map();
    static Events: Map<keyof ClientEvents, Event> = new Map();
    static Interactions: Map<string, Interactions> = new Map();
    static Subcommands: Map<string, InteractionSubCommand> = new Map();

    /**
     * Walk up a directory tree and return the path for every file in the directory and sub-directories.
     */
    static async walk(dir: string, fn: (path: string) => boolean) {
        const ini = new Set<string>(await readdir(dir));
        const files = new Set<string>(); 
    
        while (ini.size !== 0) {        
            for (const d of ini) {
                const path = resolve(dir, d);
                ini.delete(d); // remove from set
                const stats = await stat(path);
    
                if (stats.isDirectory()) {
                    for (const f of await readdir(path))
                        ini.add(resolve(path, f));
                } else if (stats.isFile() && fn(d)) {
                    files.add(path);
                }
            }
        }
    
        return [...files];
    }

    async loadCommands() {
        const commands = await KhafraClient.walk('build/src/Commands', p => p.endsWith('.js'));
        const importPromise = commands.map(command => import(pathToFileURL(command).href) as DynamicImportCommand);
        const settled = await Promise.allSettled(importPromise);

        let rejected = 0;

        for (const fileImport of settled) {
            if (fileImport.status === 'rejected') {
                console.log(fileImport.reason);
                rejected++;
            } else {
                const kCommand = new fileImport.value.kCommand();
                
                KhafraClient.Commands.set(kCommand.settings.name.toLowerCase(), kCommand);
                kCommand.settings.aliases!.forEach(alias => KhafraClient.Commands.set(alias, kCommand));
            }
        }

        console.log(green(`Loaded ${bright(commands.length - rejected)}/${settled.length} commands!`));
        return KhafraClient.Commands;
    }

    async loadEvents() {
        const events = await KhafraClient.walk('build/src/Events', p => p.endsWith('.js'));
        const importPromise = events.map(event => import(pathToFileURL(event).href) as DynamicImportEvent);
        const settled = await Promise.allSettled(importPromise);

        let rejected = 0;

        for (const fileImport of settled) {
            if (fileImport.status === 'rejected') {
                console.log(fileImport.reason);
                rejected++;
            } else {
                const kEvent = new fileImport.value.kEvent();

                KhafraClient.Events.set(kEvent.name, kEvent);
            }
        }

        console.log(green(`Loaded ${bright(KhafraClient.Events.size - rejected)}/${settled.length} events!`));
        return KhafraClient.Events;
    }

    async loadInteractions() {
        const interactionPaths = await KhafraClient.walk('build/src/Interactions', p => p.endsWith('.js'));
        const importPromise = interactionPaths.map(
            int => import(pathToFileURL(int).href) as DynamicImportAppCommand
        );
        const imported = await Promise.allSettled(importPromise);

        const rest = new REST({ version: APIVersion }).setToken(env.TOKEN!);
        const loaded: Interactions[] = [];
        let loadedSubCommands = 0;

        for (const interaction of imported) {
            if (interaction.status === 'fulfilled') {
                if ('kInteraction' in interaction.value) {
                    const int = new interaction.value.kInteraction();
                    KhafraClient.Interactions.set(int.data.name, int);
                    loaded.push(int);
                } else {
                    const sub = new interaction.value.kSubCommand();
                    KhafraClient.Subcommands.set(`${sub.data.references}-${sub.data.name}`, sub);
                    loadedSubCommands++;
                }
            } else {
                console.log(interaction)
            }
        }

        if (loaded.length !== 0) {
            const deployPath = join(assets, 'interaction_last_deployed.txt');
            const scs = loaded.map(i => i.data);
            const redeploy: typeof scs = [];

            // When dealing with slash command permissions, like the rest of the 
            // application command design is, it is poorly designed. Re-deploying
            // a command removes all the permissions from it. Therefore, the bot
            // has to diff changes from the command and only re-deploy the commands
            // that have been changed since its last start up.

            if (existsSync(deployPath)) {
                const file = await readFile(deployPath, 'utf-8');
                const names: string[] = [];
                let data = '';

                for (const line of file.split(/\r?\n/g)) {
                    // File is structured as name|base64
                    const [name, b64] = line.split('|');
                    const command = scs.find(c => c.name === name);

                    if (!command) {
                        // The command was likely deleted.
                        continue;
                    }

                    names.push(command.name);
                    const newBase64 = toBase64(command);

                    if (b64 !== newBase64) {
                        redeploy.push(command);
                    }

                    data += `${command.name}|${toBase64(command)}\r\n`;
                }

                // Now we loop over all of the commands to see if any new ones have
                // been added.
                for (const command of scs) {
                    if (names.includes(command.name)) {
                        continue;
                    }

                    redeploy.push(command);
                    data += `${command.name}|${toBase64(command)}\r\n`;
                }

                // We need to re-write the file as a new command may have been added or
                // edited, and it's easier than replacing the old outdated data.
                writeFileSync(deployPath, data);
            } else {
                // If the bot has not recorded the last deployment, we must assume that
                // every command has to be deployed.
                redeploy.push(...scs);

                // Then we have to write the data to the file so we can use it!
                let data = '';

                for (const command of redeploy) {
                    data += `${command.name}|${toBase64(command)}\r\n`;
                }

                writeFileSync(deployPath, data);
            }

            const processArgs = new Minimalist(argv.slice(2).join(' '));
            const route = Routes.applicationCommands(config.botId);
            
            if (redeploy.length !== 0) {
                if (processArgs.get('dev') === true) {
                    // debugging in guild
                    await rest.put(
                        Routes.applicationGuildCommands(config.botId, config.guildId),
                        { body: redeploy }
                    );
                }

                // globally
                await rest.put(route, { body: redeploy });
            }

            // Since we cannot rely on rest.put(...) to return every application command
            // anymore, we must fetch the list from Discord's API.
            // https://discord.com/developers/docs/interactions/application-commands#get-global-application-commands
            const slashCommands = await rest.get(route) as APIApplicationCommand[];

            for (const { id, name } of slashCommands) {
                const cached = KhafraClient.Interactions.get(name);

                if (cached) {
                    cached.id = id;
                }
            }
        }

        console.log(green(`Loaded ${bright(loaded.length)} interactions and ${bright(loadedSubCommands)} sub commands!`));
        return KhafraClient.Interactions;
    }

    init = once(async () => {
        const start = performance.now();
        await this.loadEvents();
        await this.loadCommands();
        await this.login(env.TOKEN);
        console.log(magenta(`Started in ${((performance.now() - start) / 1000).toFixed(2)} seconds!`));
    });
}
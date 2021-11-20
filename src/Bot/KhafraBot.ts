import { Command } from '../Structures/Command.js';
import { Event } from '../Structures/Event.js';
import { Interactions } from '../Structures/Interaction.js';
import { once } from '../lib/Utility/Memoize.js';
import { createFileWatcher } from '../lib/Utility/FileWatcher.js';
import { cwd } from '../lib/Utility/Constants/Path.js';
import { Client, ClientEvents } from 'discord.js';
import { REST } from '@discordjs/rest';
import { APIVersion, Routes } from 'discord-api-types/v9';
import { join, resolve } from 'path';
import { readdir, stat } from 'fs/promises';
import { pathToFileURL } from 'url';
import { performance } from 'perf_hooks';
import { Minimalist } from '../lib/Utility/Minimalist.js';
import { bright, green, magenta } from '../lib/Utility/Colors.js';

type DynamicImportCommand = Promise<{ kCommand: new (...args: unknown[]) => Command }>;
type DynamicImportEvent = Promise<{ kEvent: new (...args: unknown[]) => Event }>;

const config = createFileWatcher({} as typeof import('../../config.json'), join(cwd, 'config.json'));

export class KhafraClient extends Client {
    static Commands: Map<string, Command> = new Map();
    static Events: Map<keyof ClientEvents, Event> = new Map();
    static Interactions: Map<string, Interactions> = new Map();

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
            int => import(pathToFileURL(int).href) as Promise<{ kInteraction: new () => Interactions }>
        );
        const imported = await Promise.allSettled(importPromise);

        const rest = new REST({ version: APIVersion }).setToken(process.env.TOKEN!);
        const loaded: Interactions[] = [];

        for (const interaction of imported) {
            if (interaction.status === 'fulfilled') {
                const int = new interaction.value.kInteraction();
                KhafraClient.Interactions.set(int.data.name, int);
                loaded.push(int);
            }
        }

        if (loaded.length !== 0) {
            const scs = loaded.map(i => i.data);
            const processArgs = new Minimalist(process.argv.slice(2).join(' '));
            
            if (processArgs.get('dev') === true) {
                // debugging in guild
                await rest.put(
                    Routes.applicationGuildCommands(config.botId, config.guildId),
                    { 
                        body: scs.map(i => (i.default_permission = true) && i)
                    }
                );
            }

            // globally
            await rest.put(
                Routes.applicationCommands(config.botId),
                { body: scs }
            );
        }

        console.log(green(`Loaded ${bright(loaded.length)} interactions!`));
        return KhafraClient.Interactions;
    }

    init = once(async () => {
        const start = performance.now();
        await this.loadEvents();
        await this.loadCommands();
        await this.login(process.env.TOKEN);
        console.log(magenta(`Started in ${((performance.now() - start) / 1000).toFixed(2)} seconds!`));
    });
}
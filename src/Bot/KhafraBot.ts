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
        const importPromise = commands.map(command => import(pathToFileURL(command).href) as Promise<Command>);
        const settled = await Promise.allSettled(importPromise);

        const rejected = settled.filter((p): p is PromiseRejectedResult => p.status === 'rejected');
        for (const reject of rejected)
            console.log(reject.reason);

        console.log(green(`Loaded ${bright(commands.length - rejected.length)}/${settled.length} commands!`));
        return KhafraClient.Commands;
    }

    async loadEvents() {
        const events = await KhafraClient.walk('build/src/Events', p => p.endsWith('.js'));
        const importPromise = events.map(event => import(pathToFileURL(event).href) as Promise<Event>);
        await Promise.allSettled(importPromise);

        console.log(green(`Loaded ${bright(KhafraClient.Events.size)} events!`));
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
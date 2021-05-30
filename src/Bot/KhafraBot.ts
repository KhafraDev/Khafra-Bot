import { Command } from '../Structures/Command.js';
import { Client, ClientEvents } from 'discord.js';
import { resolve } from 'path';
import { readdir, stat } from 'fs/promises';
import { Event } from '../Structures/Event.js';
import { Interactions } from '../Structures/Interaction.js';
import { pathToFileURL } from 'url';

export class KhafraClient extends Client {
    static Commands: Map<string, Command> = new Map();
    static Events: Map<keyof ClientEvents, Event> = new Map();
    static Interactions: Map<string, Interactions> = new Map();

    /**
     * Walk up a directory tree and return the path for every file in the directory and sub-directories.
     */
    walk = async (dir: string, fn: (path: string) => boolean) => {
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
        const commands = await this.walk('build/src/Commands', p => p.endsWith('.js'));
        const importPromise = commands.map<Promise<Command>>(command => import(pathToFileURL(command).href));
        const settled = await Promise.allSettled(importPromise);

        const rejected = settled.filter(p => p.status === 'rejected') as PromiseRejectedResult[];
        for (const reject of rejected)
            console.log(reject.reason);

        console.log(`Loaded ${commands.length - rejected.length} commands!`);
        return KhafraClient.Commands;
    }

    async loadEvents() {
        const events = await this.walk('build/src/Events', p => p.endsWith('.js'));
        const importPromise = events.map<Promise<Event>>(event => import(pathToFileURL(event).href));
        await Promise.allSettled(importPromise);

        console.log(`Loaded ${KhafraClient.Events.size} events!`);
        return KhafraClient.Events;
    }

    async loadInteractions() {
        const interactions = await this.walk('build/src/Interactions', p => p.endsWith('.js'));
        const importPromise = interactions.map<Promise<Interactions>>(int => import(pathToFileURL(int).href));
        await Promise.allSettled(importPromise);

        console.log(`Loaded ${importPromise.length} global interactions!`);
        return KhafraClient.Interactions;
    }

    async init() {
        const start = Date.now();
        await this.loadEvents();
        await this.loadCommands();
        await this.login(process.env.TOKEN);
        console.log(`Started in ${((Date.now() - start) / 1000).toFixed(2)} seconds!`);
    }
}
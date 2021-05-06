import { Command } from '../Structures/Command.ts';
import { resolve } from 'https://deno.land/std@0.95.0/path/mod.ts';
import { Event } from '../Structures/Event.ts';

export class KhafraClient {
    static Commands: Map<string, Command> = new Map();
    static Events: Map<string, Event> = new Map();

    /**
     * Walk up a directory tree and return the path for every file in the directory and sub-directories.
     */
    walk = async (dir: string, fn: (path: string) => boolean) => {
        const ini = [...Deno.readDirSync(dir)];
        const f = [];

        while (ini.length !== 0) {        
            for (const d of ini) {
                const path = resolve(dir, d.name);
                ini.splice(ini.indexOf(d), 1); // remove from array
                const stats = Deno.statSync(path);

                if (stats.isDirectory) {
                    for (const f of Deno.readDirSync(path))
                        ini.push({ name: resolve(path, f.name), isDirectory: true, isSymlink: false, isFile: false });
                } else if (stats.isFile && fn(path)) {
                    f.push(path);
                } 
            }
        }

        return f;
    }

    async loadCommands() {
        const commands = await this.walk('build/src/Commands', p => p.endsWith('.js'));
        const importPromise = commands.map<Promise<Command>>(command => import(pathToFileURL(command).href));
        const settled = await Promise.allSettled(importPromise);

        const rejected = settled.filter(p => p.status === 'rejected') as PromiseRejectedResult[];
        for (const reject of rejected)
            console.log(reject.reason);

        console.log(`Loaded ${commands.length} commands!`);
        return KhafraClient.Commands;
    }

    async loadEvents() {
        const events = await this.walk('build/src/Events', p => p.endsWith('.js'));
        const importPromise = events.map<Promise<Event>>(event => import(pathToFileURL(event).href));
        await Promise.allSettled(importPromise);

        console.log(`Loaded ${events.length} events!`);
        return KhafraClient.Events;
    }

    async init() {
        const start = Date.now();
        await this.loadEvents();
        await this.loadCommands();
        console.log(`Started in ${((Date.now() - start) / 1000).toFixed(2)} seconds!`);
    }
}
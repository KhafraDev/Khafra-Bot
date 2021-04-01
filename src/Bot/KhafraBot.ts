import { Command } from '../Structures/Command.js';
import { Client, ClientOptions, ClientEvents } from 'discord.js';
import { resolve } from 'path';
import { readdir, stat } from 'fs/promises';
import { Event } from '../Structures/Event.js';
import { type } from 'os';

const absPath = (s: string) => type() === 'Windows_NT' ? `file:///${s}` : s;

export class KhafraClient extends Client {
    static Commands: Map<string, Command> = new Map();
    static Events: Map<keyof ClientEvents, Event> = new Map();

    constructor(args: ClientOptions) {
        super(args);
    }

    /**
     * Walk up a directory tree and return the path for every file in the directory and sub-directories.
     */
    walk = async (dir: string, fn: (path: string) => boolean) => {
        const ini = await readdir(dir);
        const f = Array<string>(); // same as [] but TypeScript now knows it's a string array
    
        while(ini.length !== 0) {        
            for (const d of ini) {
                const path = resolve(dir, d);
                ini.splice(ini.indexOf(d), 1); // remove from array
                const stats = await stat(path);
    
                if (stats.isDirectory()) {
                    ini.push(...(await readdir(path)).map(f => resolve(path, f)));
                } else if (stats.isFile() && fn(d)) {
                    f.push(path);
                }
            }
        }
    
        return f;
    }

    /**
     * Load commands
     */
    async loadCommands() {
        const commands = await this.walk('build/src/Commands', p => p.endsWith('.js'));
        const importPromise = commands.map<Promise<Command>>(command => import(absPath(command)));
        const settled = await Promise.allSettled(importPromise);

        const rejected = settled.filter(p => p.status === 'rejected') as PromiseRejectedResult[];
        for (const reject of rejected)
            console.log(reject.reason);

        console.log(`Loaded ${commands.length} commands!`);
        return KhafraClient.Commands;
    }

    async loadEvents() {
        const events = await this.walk('build/src/Events', p => p.endsWith('.js'));
        const importPromise = events.map<Promise<Event>>(event => import(absPath(event)));
        await Promise.allSettled(importPromise);

        console.log(`Loaded ${events.length} events!`);
        return KhafraClient.Events;
    }

    /**
     * Initialize the bot.
     */
    async init() {
        const start = Date.now();
        await this.loadEvents();
        await this.loadCommands();
        await this.login(process.env.TOKEN);
        console.log(`Started in ${((Date.now() - start) / 1000).toFixed(2)} seconds!`);
    }
}
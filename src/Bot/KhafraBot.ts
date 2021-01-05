import { Command } from '../Structures/Command.js';
import { Client, ClientOptions, ClientEvents } from 'discord.js';
import { resolve } from 'path';
import { readdir, stat } from 'fs/promises';
import { Event } from '../Structures/Event.js';
import { type } from 'os';

const absPath = (s: string) => type() === 'Windows_NT' ? `file:///${s}` : s;
const factory = <CE extends Command | Event<keyof ClientEvents>>(c: new () => CE): CE => new c();

export class KhafraClient extends Client {
    static Commands: Map<string, Command> = new Map();
    static Events: Map<keyof ClientEvents, Event<keyof ClientEvents>> = new Map();

    constructor(args: ClientOptions) {
        super(args);
    }

    load = async (dir: string) => {
        const ini = await readdir(dir);
        const f = Array<string>(); // same as [] but TypeScript now knows it's a string array
    
        while(ini.length !== 0) {        
            for(const d of ini) {
                const path = resolve(dir, d);
                ini.splice(ini.indexOf(d), 1); // remove from array
                const stats = await stat(path);
    
                if(stats.isDirectory()) {
                    ini.push(...(await readdir(path)).map(f => resolve(path, f)));
                } else if(stats.isFile() && d.endsWith('.js')) {
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
        const commands = await this.load('build/src/Commands');
        for(const command of commands) {
            const build = factory<Command>((await import(absPath(command))).default);

            KhafraClient.Commands.set(build.settings.name.toLowerCase(), build);
            build.settings.aliases?.forEach(alias => KhafraClient.Commands.set(alias, build));
        }

        console.log(`Loaded ${commands.length} commands!`);
        return KhafraClient.Commands;
    }

    async loadEvents() {
        const events = await this.load('build/src/Events');
        for(const event of events) {
            const build = factory<Event<keyof ClientEvents>>((await import(absPath(event))).default);
            KhafraClient.Events.set(build.name, build);
        }

        console.log(`Loaded ${events.length} events!`);
        return KhafraClient.Events;
    }

    /**
     * Initialize the bot.
     */
    async init() {
        await this.loadEvents();
        await this.loadCommands();
        await this.login(process.env.TOKEN);
    }
}
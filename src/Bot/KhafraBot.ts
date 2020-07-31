import { Command } from '../Structures/Command';

import { Client, ClientOptions, ClientEvents } from 'discord.js';
import { join } from 'path';
import { readdirSync, statSync } from 'fs';
import { Event } from '../Structures/Event';

class KhafraClient extends Client {
    static Commands: Map<string, Command> = new Map();
    static Events: Map<keyof ClientEvents, Event> = new Map();

    constructor(args: ClientOptions) {
        super(args);
    }

    /**
     * Load commands
     * @param groups 
     */
    async loadCommands(dir = 'build/Commands') {
        for(const path of readdirSync(dir)) {
            const curr = join(dir, path);
            if(statSync(curr).isDirectory()) {
                this.loadCommands(curr);
            } else {
                if(curr.endsWith('.js')) {
                    const { default: c } = await import(join(process.cwd(), curr));
                    const build: Command = new c();

                    KhafraClient.Commands.set(build.name, build);
                    build.aliases.forEach(alias => KhafraClient.Commands.set(alias, build));
                }
            }
        }

        return KhafraClient.Commands;
    }

    async loadEvents(dir = 'build/Events') {
        for(const event of readdirSync(dir)) {
            const { default: e } = await import(join(process.cwd(), dir, event));
            const build: Event = new e();
            KhafraClient.Events.set(build.name, build);
        }

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

export default KhafraClient;
import Command from '../Structures/Command';
import KhafraError from '../Structures/Error';

import { Client, ClientOptions, Snowflake } from 'discord.js';
import { join } from 'path';
import { readdirSync, statSync } from 'fs';

class KhafraClient extends Client {
    static CommandDir = join(process.cwd(), 'build/Commands');
    static Commands: Map<string, Command> = new Map();
    token: string;

    constructor(args: ClientOptions, token: string) {
        super(args);
        this.token = token;
    }

    /**
     * Load commands
     * @param groups 
     */
    async loadCommands(groups: string[]): Promise<Map<string, Command>> {
        for(const group of groups) {
            /** absolute path of the command */
            const path = join(KhafraClient.CommandDir, group);
            if(!statSync(path).isDirectory()) {
                new KhafraError('Client', `Loading commands failed! ${path} is not a valid directory.`);
            }

            for(const f of readdirSync(path)) {
                // dynamic import
                const c = await import(join(KhafraClient.CommandDir, group, f));
                // TS compiles this to { default: [Function: ...] }
                const build = new c.default();
                
                build.aliases.forEach((alias: string) => KhafraClient.Commands.set(alias, build));
                KhafraClient.Commands.set(build.name, build);
            }
        }

        return KhafraClient.Commands;
    }

    /*** Login to Discord */
    async login(): Promise<string> {
        return super.login(this.token);
    }

    /**
     * Initialize the bot.
     */
    async init(): Promise<void> {
        await this.loadCommands([
            'Fun',
            'Moderation',
            'Server',
            'Settings'
        ]);
        await this.login();

        return;
    }
}

export default KhafraClient;
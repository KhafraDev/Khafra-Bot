import { Command } from '#khaf/Command';
import { Event } from '#khaf/Event';
import { Interactions, InteractionSubCommand } from '#khaf/Interaction';
import { logger } from '#khaf/Logger';
import { bright, green, magenta } from '#khaf/utility/Colors.js';
import { assets, cwd } from '#khaf/utility/Constants/Path.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { once } from '#khaf/utility/Memoize.js';
import { Minimalist } from '#khaf/utility/Minimalist.js';
import { REST } from '@discordjs/rest';
import { Buffer } from 'buffer';
import { APIApplicationCommand, APIVersion, Routes } from 'discord-api-types/v9';
import { Client, ClientEvents } from 'discord.js';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { readdir, stat } from 'fs/promises';
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
                logger.error(interaction);
            }
        }

        // If we have to deal with slash commands :(
        if (loaded.length !== 0) {
            const processArgs = new Minimalist(argv.slice(2).join(' '));
            const lastDeployedPath = join(assets, 'interaction_last_deployed.txt');
            const loadedCommands = loaded.map(command => command.data);

            // https://discord.com/developers/docs/interactions/application-commands#get-global-application-commands
            // Slash commands that have already been deployed.
            // We do not have to POST/PUT these, but PATCH them
            // if they have been updated.
            const existingSlashCommands = await rest.get(
                Routes.applicationCommands(config.botId)
            ) as APIApplicationCommand[];

            for (const { id, name } of existingSlashCommands) {
                const cached = KhafraClient.Interactions.get(name);

                if (cached) {
                    cached.id = id;
                }
            }

            // Lines to write to the last deployed file.
            const data: string[] = [];

            // Commands that have already been deployed.
            // We need to PATCH these instead of overwriting.
            const previouslyDeployed: [string, string][] = existsSync(lastDeployedPath)
                ? readFileSync(lastDeployedPath, 'utf-8')
                    .trim()
                    .split(/\r?\n/g)
                    .map(line => line.split('|') as [string, string]) // "name|base64" -> ["name", "base64"]
                : [];

            // If the file does not exist, meaning no commands
            // have been deployed yet.
            // We need the bulk overwrite endpoint.
            if (previouslyDeployed.length === 0) {
                logger.info(`Bulk creating ${loadedCommands.length} slash commands...`);
                // https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
                await rest.put(
                    Routes.applicationCommands(config.botId),
                    { body: loadedCommands }
                );

                if (processArgs.get('dev') === true) {
                    await rest.put(
                        Routes.applicationGuildCommands(config.botId, config.guildId),
                        { body: loadedCommands }
                    );
                }

                data.push(...loadedCommands.map(l => `${l.name}|${toBase64(l)}`));
            } else {
                // Otherwise, we need to determine whether to
                // overwrite (create) a command or to update
                // an existing one instead.
                for (const [deployedName, deployedBase64] of previouslyDeployed) {
                    const current = loadedCommands.find(command => command.name === deployedName);
                    const existing = existingSlashCommands.find(command => command.name === deployedName);

                    // The command was deleted, the bot did not load
                    // the handler file. However, this can also be
                    // triggered by an error when importing the handler.
                    // TODO: exit the process if an error occurs when loading.
                    if (!current) {
                        logger.warn(`Command ${deployedName} was not loaded by the bot...`);
                        // const id = existing.id ...
                        continue;
                    }
                    
                    // If the command has not been loaded on Discord's side,
                    // we need to deploy it by POST request.
                    if (!existing) {
                        logger.info(`Deploying ${deployedName} slash command!`);
                        // https://discord.com/developers/docs/interactions/application-commands#create-global-application-command
                        await rest.post(
                            Routes.applicationCommands(config.botId),
                            { body: current }
                        );

                        if (processArgs.get('dev') === true) {
                            await rest.post(
                                Routes.applicationGuildCommands(config.botId, config.guildId),
                                { body: current }
                            );
                        }
                    }

                    // If the base64 for the deployed command and the current
                    // command are different, the command must be updated.
                    else if (toBase64(current) !== deployedBase64) {
                        logger.info(`Updating ${deployedName} slash command!`);
                        const id = existing.id;
                        // https://discord.com/developers/docs/interactions/application-commands#edit-global-application-command
                        await rest.patch(
                            Routes.applicationCommand(config.botId, id),
                            { body: current }
                        );

                        if (processArgs.get('dev') === true) {
                            await rest.post(
                                Routes.applicationGuildCommand(config.botId, config.guildId, id),
                                { body: current }
                            );
                        }
                    } 
                    
                    // The command already exists and has not been updated.
                    // We do not have to do anything in this case.
                    
                    data.push(`${current.name}|${toBase64(current)}`);
                }
            }

            writeFileSync(lastDeployedPath, data.join('\n'));
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
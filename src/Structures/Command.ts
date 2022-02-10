import { Cooldown } from '#khaf/cooldown/CommandCooldown.js';
import { kGuild } from '#khaf/types/KhafraBot.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { Errors } from '#khaf/utility/Constants/Errors.js';
import { cwd } from '#khaf/utility/Constants/Path.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { Minimalist } from '#khaf/utility/Minimalist.js';
import { Message, PermissionResolvable, Snowflake } from 'discord.js';
import { join } from 'path';
import { PermissionFlagsBits } from 'discord-api-types/v9';

const config = createFileWatcher({} as typeof import('../../config.json'), join(cwd, 'config.json'));

export interface Arguments {
    /** Default arguments, removes formatting (new lines, tabs, etc.) */
    readonly args: string[]
    /** Command used. */
    readonly commandName: string
    /** Text unformatted, removes mention+command with leading whitespace. */
    readonly content: string
    /** Any cli arguments provided by the user */
    readonly cli: Minimalist
}

interface ICommand {
    readonly help: string[]
    readonly permissions: PermissionResolvable
    readonly settings: {
        readonly name: string
        readonly folder: string
        readonly args: [number, number?]
        /** Ratelimit in seconds, defaults to 5 */
        readonly ratelimit?: number
        readonly permissions?: PermissionResolvable
        readonly aliases?: string[]
        readonly guildOnly?: boolean
        readonly ownerOnly?: boolean
        readonly errors?: Record<string, string>
    }
}

type HandlerReturn =
    | string
    | import('discord.js').MessageAttachment
    | import('@khaf/builders').Embed
    | import('discord.js').ReplyMessageOptions
    | void
    | null;

export abstract class Command implements ICommand {
    readonly errors = Errors;
    readonly Embed = Embed;
    readonly rateLimit: Cooldown;

    /*** Permissions required to use a command, overrides whitelist/blacklist by guild. */
    readonly permissions: PermissionResolvable[] = [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks
    ];
    
    constructor(
        public readonly help: string[],
        public readonly settings: ICommand['settings']
    ) {
        this.help = help.length < 2
            ? [...help, ...Array<string>(2 - help.length).fill('')]
            : help;
        this.permissions = this.permissions.concat(settings.permissions ?? []);
        this.settings = Object.assign(settings, { aliases: settings.aliases ?? [] });
        this.rateLimit = new Cooldown(settings.ratelimit ?? 5);
        this.errors = { ...this.errors, ...this.settings.errors };
    }

    abstract init (message?: Message, args?: Arguments, settings?: kGuild | Partial<kGuild>): 
        Promise<HandlerReturn>

    static isBotOwner = (id: Snowflake): boolean => Array.isArray(config.botOwner) 
        ? config.botOwner.includes(id) 
        : config.botOwner === id;
}
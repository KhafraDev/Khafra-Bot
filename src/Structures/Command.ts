import { 
    Message, 
    Snowflake,
    Permissions,
    PermissionResolvable
} from 'discord.js';
import { Errors } from '../lib/Utility/Constants/Errors.js';
import { Embed } from '../lib/Utility/Constants/Embeds.js';
import { kGuild } from '../lib/types/KhafraBot.js';
import { createFileWatcher } from '../lib/Utility/FileWatcher.js';
import { cwd } from '../lib/Utility/Constants/Path.js';
import { join } from 'path';
import { Minimalist } from '../lib/Utility/Minimalist.js';

const config = createFileWatcher({} as typeof import('../../config.json'), join(cwd, 'config.json'));

export interface Arguments {
    /** Default arguments, removes formatting (new lines, tabs, etc.) */
    readonly args: string[]
    /** Command used. */
    readonly commandName: string
    /** Text unformatted, removes prefix+command with leading whitespace. */
    readonly content: string
    /** Prefix used */
    readonly prefix: string
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
        ratelimit?: number
        readonly permissions?: PermissionResolvable
        aliases?: string[]
        readonly guildOnly?: boolean
        readonly ownerOnly?: boolean
        readonly errors?: Record<string, string>
    }
}

type HandlerReturn =
    | string
    | import('discord.js').MessageAttachment
    | import('discord.js').MessageEmbed
    | import('discord.js').ReplyMessageOptions
    | void
    | null;

export abstract class Command implements ICommand {
    readonly errors = Errors;
    readonly Embed = Embed;

    /*** Permissions required to use a command, overrides whitelist/blacklist by guild. */
    readonly permissions: PermissionResolvable[] = [ 
        Permissions.FLAGS.SEND_MESSAGES,
        Permissions.FLAGS.EMBED_LINKS,
        Permissions.FLAGS.VIEW_CHANNEL
    ];
    
    constructor(
        public readonly help: string[],
        public readonly settings: ICommand['settings']
    ) {
        this.help = help.length < 2
            ? [...help, ...Array<string>(2 - help.length).fill('')]
            : help;
        this.permissions = this.permissions.concat(settings.permissions ?? []);
        this.settings = settings;
        this.settings.aliases ??= [];
        this.settings.ratelimit ??= 5;
        this.errors = Object.assign({ ...this.errors }, this.settings.errors);
    }

    abstract init (message?: Message, args?: Arguments, settings?: kGuild | Partial<kGuild>): 
        HandlerReturn | Promise<HandlerReturn>

    static isBotOwner = (id: Snowflake) => Array.isArray(config.botOwner) 
        ? config.botOwner.includes(id) 
        : config.botOwner === id;
}
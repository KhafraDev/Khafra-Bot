import { 
    Message, 
    Snowflake,
    Permissions,
    PermissionResolvable
} from 'discord.js';
import { Logger } from './Logger.js';
import config from '../../config.json';
import { Errors } from '../lib/Utility/Constants/Errors.js';
import { Embed } from '../lib/Utility/Constants/Embeds.js';
import { kGuild } from '../lib/types/Warnings.js';

export interface Arguments {
    /** Default arguments, removes formatting (new lines, tabs, etc.) */
    args: string[]
    /** Command used. */
    commandName: string
    /** Text unformatted, removes prefix+command with leading whitespace. */
    content: string
    /** Prefix used */
    prefix: string
}

interface ICommand {
    logger: Logger
    help: string[]
    permissions: PermissionResolvable
    settings: {
        name: string
        folder: string
        args: [number, number?]
        /** Ratelimit in seconds, defaults to 5 */
        ratelimit?: number
        permissions?: PermissionResolvable
        aliases?: string[]
        guildOnly?: boolean
        ownerOnly?: boolean
        errors?: Record<string, string>
    }
}

export abstract class Command implements ICommand {
    logger = new Logger('Command');
    errors = Errors;
    Embed = Embed;

    /*** Description and example usage. */
    help: string[];
    /*** Permissions required to use a command, overrides whitelist/blacklist by guild. */
    permissions: PermissionResolvable[] = [ 
        Permissions.FLAGS.SEND_MESSAGES,
        Permissions.FLAGS.EMBED_LINKS,
        Permissions.FLAGS.VIEW_CHANNEL, 
        Permissions.FLAGS.READ_MESSAGE_HISTORY 
    ];
    settings: ICommand['settings'];
    
    constructor(
        help: string[],
        settings: ICommand['settings']
    ) {
        this.help = help;
        this.permissions = this.permissions.concat(settings.permissions ?? []);
        this.settings = settings;
        this.settings.aliases ??= [];
        this.settings.ratelimit ??= 5;
        this.errors = Object.assign({ ...this.errors }, this.settings.errors);
    }

    abstract init (message?: Message, args?: Arguments, settings?: kGuild | Partial<kGuild>): 
        Promise<unknown> | unknown;

    isBotOwner = (id: Snowflake) => Array.isArray(config.botOwner) 
        ? config.botOwner.includes(id) 
        : config.botOwner === id;
}
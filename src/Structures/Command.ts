import { 
    Message, 
    PermissionString,
    TextChannel,
    Snowflake,
    Channel,
} from 'discord.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Logger } from './Logger';

const { botOwner }: { botOwner: string[] | string } = JSON.parse(readFileSync(join(__dirname, '../../config.json')).toString());

export class Command {
    logger = new Logger('Command');
    /*** Description and example usage. */
    help: string[];
    /*** Permissions required to use a command, overrides whitelist/blacklist by guild. */
    permissions: PermissionString[] = [ 'SEND_MESSAGES', 'EMBED_LINKS', 'VIEW_CHANNEL', 'READ_MESSAGE_HISTORY' ];

    settings?: {
        /** Command name */
        name: string,
        /** Folder where command exists */
        folder: string,
        /** Command aliases */
        aliases?: string[],
        /** Command cooldown */
        cooldown?: number,
        /** If command only works in guilds */
        guildOnly?: boolean,
        /** If command is only available to bot owner */
        ownerOnly?: boolean
    };
    
    constructor(
        help: string[],
        permissions: PermissionString[],
        settings: {
            name: string,
            folder: string,
            cooldown?: number,
            aliases?: string[],
            guildOnly?: boolean,
            ownerOnly?: boolean
        } 
    ) {
        this.help = help;
        this.permissions = this.permissions.concat(permissions);
        this.settings = settings;
    }

    hasPermissions(message: Message, channel?: Channel, permissions?: PermissionString[]) {
        if(channel?.type === 'dm' || message.channel.type === 'dm') {
            return true;
        }

        const memberPerms           = message.member.permissions;
        const botPerms              = message.guild.me.permissions;
        const botChannelPerms       = ((channel ?? message.channel) as TextChannel).permissionsFor(message.guild.me);
        const memberChannelPerms    = ((channel ?? message.channel) as TextChannel).permissionsFor(message.member);
        
        const check = permissions ?? this.permissions;
        return    memberPerms.has(check)         // message author perms
               && botPerms.has(check)            // perms for bot in guild
               && botChannelPerms.has(check)     // bot perms in channel
               && memberChannelPerms.has(check); // member perms in channel
    }

    /**
     * Check individual perms for user, not bot perms.
     * @param message Message from API
     * @param perms Array of permissions the user must have
     */
    userHasPerms(message: Message, perms: PermissionString[]) {
        if(message.channel.type === 'dm') {
            return true;
        }
        
        const memberPerms = message.member.permissions;
        return memberPerms.has(perms);
    }

    isBotOwner(id: Snowflake) {
        return Array.isArray(botOwner) ? botOwner.indexOf(id) > -1 : botOwner === id;
    }

    init(_: Message, __?: string[]): unknown {
        throw new Error('init called on Command with function');
    }
}
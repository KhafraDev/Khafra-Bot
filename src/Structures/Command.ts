import { 
    Message, 
    PermissionString,
    TextChannel,
    Snowflake,
    Channel,
} from 'discord.js';

export class Command {
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
        cooldown: number,
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
            cooldown: number,
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
        
        return (permissions ?? this.permissions).every(perm => 
            memberPerms.has(perm)        && // general perms
            botPerms.has(perm)           && // general perms
            botChannelPerms.has(perm)    && // channel perms
            memberChannelPerms.has(perm)    // channel perms
        );
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
        return perms.every(perm => memberPerms.has(perm));
    }

    isBotOwner(id: Snowflake) {
        return id === '267774648622645249';
    }
}
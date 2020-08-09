import { 
    Message, 
    PermissionString,
    TextChannel,
    Snowflake,
} from 'discord.js';

export class Command {
    /*** Name of the command; used for fetching and executing. */
    name: { name: string, folder: string };
    /*** Description and example usage. */
    help: string[];
    /*** Permissions required to use a command, overrides whitelist/blacklist by guild. */
    permissions: PermissionString[] = [ 'SEND_MESSAGES', 'EMBED_LINKS', 'VIEW_CHANNEL', 'READ_MESSAGE_HISTORY' ];
    /** Cooldown for command (-1 for none) */
    cooldown: number;
    /*** Command aliases */
    aliases?: string[];
    
    constructor(
        name: { name: string, folder: string },
        help: string[],
        permissions: PermissionString[],
        cooldown: number,
        aliases?: string[] 
    ) {
        this.name = name;
        this.help = help;
        this.permissions = this.permissions.concat(permissions);
        this.cooldown = cooldown;
        this.aliases = aliases ?? [];
    }

    hasPermissions(message: Message, channel?: TextChannel, permissions?: PermissionString[]) {
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
        const memberPerms = message.member.permissions;
        return perms.every(perm => memberPerms.has(perm));
    }

    isBotOwner(id: Snowflake) {
        return id === '267774648622645249';
    }
}
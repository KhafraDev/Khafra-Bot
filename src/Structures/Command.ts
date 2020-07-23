import { 
    Message, 
    PermissionString,
    TextChannel,
    Snowflake
} from 'discord.js';

export class Command {
    /*** Name of the command; used for fetching and executing. */
    name: string;
    /*** Description of the command for the help command. */
    description: string;
    /*** Permissions required to use a command, overrides whitelist/blacklist by guild. */
    permissions: PermissionString[];
    /** Cooldown for command (-1 for none) */
    cooldown: number;
    /*** Command aliases */
    aliases?: string[]
    
    constructor(
        name: string,
        description: string,
        permissions: PermissionString[],
        cooldown: number,
        aliases?: string[] 
    ) {
        this.name = name;
        this.description = description;
        this.permissions = [].concat(
            [ 'SEND_MESSAGES', 'EMBED_LINKS', 'VIEW_CHANNEL' ] as PermissionString[], // required permissions
            permissions
        );
        this.cooldown = cooldown;
        this.aliases = aliases ?? [];
    }

    /**
     * initialize the command
     */
    init(message: Message, args: string[]): any {
        throw new Error('No init method found on class!');
    }

    hasPermissions(message: Message) {
        const memberPerms           = message.member.permissions;
        const botPerms              = message.guild.me.permissions;
        const botChannelPerms       = (message.channel as TextChannel).permissionsFor(message.guild.me);
        const memberChannelPerms    = (message.channel as TextChannel).permissionsFor(message.member);
        
        return this.permissions.every(perm => 
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
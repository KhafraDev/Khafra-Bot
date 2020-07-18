import KhafraError from './Error';
import { 
    Message, 
    Permissions, 
    PermissionString,
    MessageEmbed,
    TextChannel,
    Snowflake
} from 'discord.js';

class Command {
    /*** Name of the command; used for fetching and executing. */
    name: string;
    /*** Description of the command for the help command. */
    description: string;
    /*** Permissions required to use a command, overrides whitelist/blacklist by guild. */
    permissions: PermissionString[];
    /*** Command aliases */
    aliases?: string[]
    
    constructor(
        name: string,
        description: string,
        permissions: PermissionString[],
        aliases?: string[] 
    ) {
        this.name = name;
        this.description = description;
        this.permissions = permissions;
        this.aliases = aliases ?? [];
    }

    hasPermissions(message: Message): boolean {
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

    /**
     * initialize the command
     */
    init(_: Message, __: string[]): any {
        new KhafraError('Command Interface', 'No init method found on class!', 'Command.ts');
    }

    /**
     * send a message if an operation fails!
     * @param reason fail reason
     */
    failEmbed(reason: string): MessageEmbed {
        const embed = new MessageEmbed();
        embed.setColor('#FF0000');
        embed.setDescription(reason);

        return embed;
    }

    isBotOwner(id: Snowflake): boolean {
        return id === '267774648622645249';
    }

    /**
     * Check message for required criteria.
     * @param message 
     */
    static Sanitize(message: Message) : boolean {
        if(message.author.bot) {
            return false;
        } else if(!message.guild?.available) {
            return false;
        } else if(message.channel.type === 'dm') {
            return false;
        } else if(!message.member) {
            return false;
        } else if(message.system) {
            return false;
        }

        const perms = message.guild.me.permissions;
        const channelPerms = (message.channel as TextChannel).permissionsFor(message.guild.me);
        if(
            !perms.has(Permissions.FLAGS.SEND_MESSAGES)         || // guild perms
            !perms.has(Permissions.FLAGS.EMBED_LINKS)           || // guild perms
            !channelPerms.has(Permissions.FLAGS.SEND_MESSAGES)  || // channel perms
            !channelPerms.has(Permissions.FLAGS.EMBED_LINKS)       // channel perms
        ) {
            return false;
        }

        return true;
    }
}

export default Command;
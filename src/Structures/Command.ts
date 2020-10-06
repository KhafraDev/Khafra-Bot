import { 
    Message, 
    PermissionString,
    TextChannel,
    Snowflake,
    Channel,
    MessageEmbed,
} from 'discord.js';
import { Logger } from './Logger';

import { embed, botOwner } from '../../config.json';

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
        /** Required number of arguments */
        args: [number, number?];
        /** Command aliases */
        aliases?: string[],
        /** If command only works in guilds */
        guildOnly?: boolean,
        /** If command is only available to bot owner */
        ownerOnly?: boolean
    };
    
    constructor(
        help: string[],
        permissions: PermissionString[],
        settings?: {
            name: string,
            folder: string,
            args: [number, number?],
            aliases?: string[],
            guildOnly?: boolean,
            ownerOnly?: boolean
        } 
    ) {
        this.help = help;
        this.permissions = this.permissions.concat(permissions);
        this.settings = settings;
        this.settings && (this.settings.aliases = this.settings.aliases ?? []);
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

    get Embed() {
        const Embed = new MessageEmbed();

        return {
            fail: (reason?: string) => {
                Embed.setColor(embed.fail);
                reason && Embed.setDescription(reason);
                
                return Embed;
            },
        
            /**
             * An embed for a command being successfully executed!
             */
            success: (reason?: string) => {
                Embed.setColor(embed.success);    
                reason && Embed.setDescription(reason);
                
                return Embed;
            },
    
            /**
             * An embed for missing permissions!
             */
            missing_perms: (admin?: boolean, perms?: PermissionString[]) => {
                return Embed.setColor(embed.fail).setDescription(`
                One of us doesn't have the needed permissions!
        
                Both of us must have \`\`${perms?.join(', ') ?? this.permissions.join(', ')}\`\` permissions to use this command!
                ${admin ? 'You must have \`\`ADMINISTRATOR\`\` perms to use this command!' : '' }
                `);
            },
    
            /**
             * A generic help embed useful for most situations.
             * @this {Command}
             */
            generic: (reason?: string) => {
                const [min, max] = this.settings.args;
                const r = reason ?? `Missing ${min} minimum argument${min === 1 ? '' : 's'} (${max} maximum).`;
                
                return Embed.setColor(embed.fail).setDescription(`
                ${r}

                Aliases: ${this.settings.aliases.map(a => `\`\`${a}\`\``).join(', ')}
                Permissions: ${this.permissions.map(p => `\`\`${p}\`\``).join(', ')}

                Example Usage:
                ${this.help.slice(1).map((e: string) => `\`\`${this.settings.name}${e.length > 0 ? ` ${e}` : ''}\`\``).join('\n')}
                `)
                .addFields(
                    { name: '**Guild Only:**', value: this.settings.guildOnly ? 'Yes' : 'No', inline: true },
                    { name: '**Owner Only:**', value: this.settings.ownerOnly ? 'Yes' : 'No', inline: true }
                );
            }
        }
    }

    static get Embed() {
        return new Command([], []).Embed;
    }
}
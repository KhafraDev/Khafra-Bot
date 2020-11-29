import { 
    Message, 
    PermissionString,
    Snowflake,
    MessageEmbed,
    Permissions,
    BitFieldResolvable,
    Channel
} from 'discord.js';
import { Logger } from './Logger.js';
import { createRequire } from 'module';
import { GuildSettings } from '../lib/types/Collections.js';
import { isText } from '../lib/types/Discord.js.js';

const { embed, botOwner } = createRequire(import.meta.url)('../../config.json');
const entries: [string, number][] = Object.entries(Permissions.FLAGS);

interface ICommand {
    logger: Logger
    cooldown?: (id: string) => boolean // typeof cooldown isn't the returned function
    help: string[]
    permissions: number[]
    settings: {
        name: string
        folder: string
        args: [number, number?]
        permissions?: number[]
        aliases?: string[]
        guildOnly?: boolean
        ownerOnly?: boolean
    }
}

export class Command implements ICommand {
    logger = new Logger('Command');
    cooldown?: (id: string) => boolean

    /*** Description and example usage. */
    help: string[];
    /*** Permissions required to use a command, overrides whitelist/blacklist by guild. */
    permissions = [ 
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
        this.settings.aliases = this.settings.aliases ?? [];
    }

    hasPermissions(message: Message, channel: Channel = message.channel, permissions = this.permissions) {
        if(!isText(channel)) {
            return true;
        }

        const memberPerms        = message.member.permissions;
        const botPerms           = message.guild.me.permissions;
        const botChannelPerms    = channel.permissionsFor(message.guild.me);
        const memberChannelPerms = channel.permissionsFor(message.member);
        
        return memberPerms.has(permissions)            // message author perms
               && botPerms.has(permissions)            // perms for bot in guild
               && botChannelPerms.has(permissions)     // bot perms in channel
               && memberChannelPerms.has(permissions); // member perms in channel
    }

    /**
     * Check individual perms for user, not bot perms.
     * @param message Message from API
     * @param perms Array of permissions the user must have
     */
    userHasPerms(message: Message, perms: BitFieldResolvable<PermissionString>) {
        if(!isText(message.channel)) {
            return true;
        }
        
        const memberPerms = message.member.permissions;
        return memberPerms.has(perms);
    }

    isBotOwner(id: Snowflake) {
        return Array.isArray(botOwner) ? botOwner.includes(id) : botOwner === id;
    }

    init(_: Message, __: string[], ___?: GuildSettings): unknown {
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
            missing_perms: (admin?: boolean, perms?: number[]) => {
                const permStr = Command.permsFromBitField(perms ?? this.permissions);

                return Embed.setColor(embed.fail).setDescription(`
                One of us doesn't have the needed permissions!
        
                Both of us must have ${permStr} permissions to use this command!
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
                Permissions: ${Command.permsFromBitField(this.permissions)}

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

    static permsFromBitField(perms: number[]) {
        const permStr = perms
            .map(p => `\`\`${entries.filter(e => e[1] === p).shift()[0]}\`\``)
            .join(', ');
            
        return permStr;
    }

    static get Embed() {
        return new Command([], {
            name: '',
            folder: '',
            args: [-1, -1],
        }).Embed;
    }
}
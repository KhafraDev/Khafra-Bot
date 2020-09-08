import { Command } from "../../Structures/Command";
import { 
    Message, 
    MessageMentions, 
    Role, 
    TextChannel, 
    GuildMember 
} from "discord.js";
import Embed from "../../Structures/Embed";
import KhafraClient from "../../Bot/KhafraBot";
import { pool } from "../../Structures/Database/Mongo";

const handle = async (
    message: Message, 
    command: Command, 
    type: 'role' | 'guild' | 'user' | 'channel',
    item?: Role | TextChannel | GuildMember
) => {
    const client = await pool.settings.connect();
    const collection = client.db('khafrabot').collection('settings');

    const inserted = await collection.updateOne(
        { id: message.guild.id },
        { $addToSet: {
            disabled: {
                command: command.settings.name,
                aliases: command.settings.aliases,
                type,
                id: item?.id ?? null
            }
        } },
        { upsert: true }
    );

    if(inserted.modifiedCount === 1 || inserted.upsertedCount === 1) {
        return message.channel.send(Embed.success(`
        Command ${command.settings.name} has been disabled ${item instanceof Role || item instanceof GuildMember ? 'for' : 'in'} ${item ?? 'the guild'}!
        `));
    } else {
        return message.channel.send(Embed.fail('An unexpected error occurred!'));
    }
}

export default class extends Command {
    constructor() {
        super(
            [
                'Disable a command in a guild, channel, role, or for a user!',
                '[command name] [user/channel/role/leave blank for entire guild]',
                'badmeme #general',
                'badmeme @muted',
                'badmeme @Khafra#0001',
                'badmeme'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'disable',
                folder: 'Settings',
                args: [1, 2],
                aliases: [ 'blacklist', 'denylist' ],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(Embed.missing_perms.call(this, true));
        } else if(args.length < 1 || args.length > 2) {
            return message.channel.send(Embed.missing_args.call(this, 1));
        }

        const [ command, type='guild' ] = args;
        const kCommand = KhafraClient.Commands.get(command.toLowerCase());
        if(!kCommand) {
            return message.channel.send(Embed.fail(`
            No command found with that name!
            `));
        } else if(type === 'guild') {
            return handle(message, kCommand, type);
        }
        
        const id = type.replace(/[^0-9]/g, '');
        if(type !== 'guild' && (id.length < 17 || id.length > 19)) {
            return message.channel.send(Embed.fail('Type was included but it is invalid.'));
        }
        
        const r = MessageMentions.ROLES_PATTERN.test(type) 
            ? message.mentions.roles.first() 
            : await message.guild.roles.fetch(id);

        if(r instanceof Role) {
            if(r.deleted) {
                return message.channel.send(Embed.fail(`
                Congrats! I have no idea how you got this to happen, but the role is deleted.
                `));
            } else if(r.managed) {
                return message.channel.send(Embed.fail(`
                Role is managed by another party.
                `));
            } else {
                return handle(message, kCommand, 'role', r);
            }
        }

        // silently ignore error and attempt to fetch guild member next
        try {
            const c = message.mentions.channels.first() ?? await message.client.channels.fetch(id);

            if(!c.deleted && c.type === 'text') {
                return handle(message, kCommand, 'channel', c as TextChannel);
            } else {
                return message.channel.send(Embed.fail('Invalid channel type!'));
            }
        } catch {}

        try {
            const g = message.mentions.members.first() ?? await message.guild.members.fetch(id);

            return handle(message, kCommand, 'user', g);
        } catch {
            return message.channel.send(Embed.fail(`
            No user, channel, or role provided.
            `));
        }
    }
}
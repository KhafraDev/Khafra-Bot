import { Command } from "../../../Structures/Command";
import { Message, Role, TextChannel, NewsChannel, User } from "discord.js";
import Embed from "../../../Structures/Embed";
import { pool } from "../../../Structures/Database/Mongo";
import KhafraClient from "../../../Bot/KhafraBot";

const blacklistedFolders = [ 'Settings', 'Moderation' ];

export default class extends Command {
    constructor() {
        super(
            [
                'Enable a command in a guild or channel or for a role or user!',
                'for role @role badmeme', 'for user @Khafra#0001 ban', 'for channel #general badmeme',
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'enable',
                folder: 'Settings',
                args: [4, 4],
                guildOnly: true,
                aliases: [ 'whitelist', 'allowlist', 'allow' ]
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(Embed.missing_perms.call(this, true));
        } 

        const [ f, type, mentionOrID, commandName ] = args;
        const id = mentionOrID?.replace(/[^\d]/g, '');

        if(f !== 'for' && f !== 'in') {
            return message.channel.send(Embed.missing_args.call(this, 'First argument must be "for" or "in"!'));
        } else if(!['role', 'user', 'channel'].includes(type.toLowerCase())) {
            return message.channel.send(Embed.missing_args.call(this, 'Second argument must be user | role | channel!'));
        } else if(id.length < 17 || id.length > 19) {
            return message.channel.send(Embed.missing_args.call(this, `Invalid ${type} ID or mention!`));
        } 

        const command = KhafraClient.Commands.get(commandName.toLowerCase());
        if(!command) {
            return message.channel.send(Embed.fail('No command to enable!'));
        } else if(blacklistedFolders.includes(command.settings.folder)) {
            return message.channel.send(Embed.fail(`Cannot enable commands in ${blacklistedFolders.join(' and ')} folders!`));
        }

        let item: Role | TextChannel | NewsChannel | User;
        if(type === 'role') {
            item = await message.guild.roles.fetch(id);
            if(!(item instanceof Role) || item.managed || item.deleted) {
                return message.channel.send(Embed.fail('Invalid Role!'));
            }
        } else if(type === 'user') {
            try {
                item = await message.client.users.fetch(id);
            } catch {
                return message.channel.send(Embed.fail('Invalid User!'));
            }
        } else if(type === 'channel') {
            try {
                const channel = await message.client.channels.fetch(id);
                if(channel.type !== 'text' && channel.type !== 'news') {
                    return message.channel.send(Embed.fail('Only text and news channels allowed!'));
                }
                item = channel as TextChannel | NewsChannel;
            } catch {
                return message.channel.send(Embed.fail('Invalid Channel!'));
            }
        }

        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');

        const inserted = await collection.updateOne(
            { id: message.guild.id },
            { 
                $addToSet: {
                    enabled: {
                        command: command.settings.name,
                        aliases: command.settings.aliases,
                        type,
                        id: item.id
                    }
                },
                $pull: {
                    disabled: {
                        command: command.settings.name,
                        aliases: command.settings.aliases,
                        type,
                        id: item.id
                    }
                }
            },
            { upsert: true }
        );

        if(inserted.modifiedCount === 1 || inserted.upsertedCount === 1) {
            return message.channel.send(Embed.success(`
            Command ${command.settings.name} has been enabled ${item instanceof Role || item instanceof User ? 'for' : 'in'} ${item}!
            `));
        } else {
            return message.channel.send(Embed.fail('An unexpected error occurred!'));
        }
    }
}
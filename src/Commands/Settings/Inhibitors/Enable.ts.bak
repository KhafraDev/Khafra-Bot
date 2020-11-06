import { Command } from "../../../Structures/Command.js";
import { Message, Role, TextChannel, NewsChannel, User } from "discord.js";
import { pool } from "../../../Structures/Database/Mongo.js";
import { KhafraClient } from "../../../Bot/KhafraBot.js";

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
            return message.channel.send(this.Embed.missing_perms(true));
        } 

        const [ f, type, mentionOrID, commandName ] = args;
        const id = mentionOrID?.replace(/[^\d]/g, '');

        if(f !== 'for' && f !== 'in') {
            return message.channel.send(this.Embed.generic('First argument must be "for" or "in"!'));
        } else if(!['role', 'user', 'channel'].includes(type.toLowerCase())) {
            return message.channel.send(this.Embed.generic('Second argument must be user | role | channel!'));
        } else if(id.length < 17 || id.length > 19) {
            return message.channel.send(this.Embed.generic(`Invalid ${type} ID or mention!`));
        } 

        const command = KhafraClient.Commands.get(commandName.toLowerCase());
        if(blacklistedFolders.includes(command?.settings.folder)) {
            return message.channel.send(this.Embed.fail(`Cannot enable commands in ${blacklistedFolders.join(' and ')} folders!`));
        }

        let item: Role | TextChannel | NewsChannel | User;
        if(type === 'role') {
            item = await message.guild.roles.fetch(id);
            if(!(item instanceof Role) || item.managed || item.deleted) {
                return message.channel.send(this.Embed.fail('Invalid Role!'));
            }
        } else if(type === 'user') {
            try {
                item = await message.client.users.fetch(id);
            } catch {
                return message.channel.send(this.Embed.fail('Invalid User!'));
            }
        } else if(type === 'channel') {
            try {
                const channel = await message.client.channels.fetch(id);
                if(channel.type !== 'text' && channel.type !== 'news') {
                    return message.channel.send(this.Embed.fail('Only text and news channels allowed!'));
                }
                item = channel as TextChannel | NewsChannel;
            } catch {
                return message.channel.send(this.Embed.fail('Invalid Channel!'));
            }
        }

        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');

        const inserted = await collection.updateOne(
            { id: message.guild.id },
            { 
                $addToSet: {
                    enabled: {
                        command: command?.settings.name ?? commandName.toLowerCase(),
                        aliases: command?.settings.aliases ?? null,
                        type,
                        id: item.id
                    }
                },
                $pull: {
                    disabled: {
                        command: command?.settings.name ?? commandName.toLowerCase(),
                        aliases: command?.settings.aliases ?? null,
                        type,
                        id: item.id
                    }
                }
            },
            { upsert: true }
        );

        if(inserted.modifiedCount === 1 || inserted.upsertedCount === 1) {
            return message.channel.send(this.Embed.success(`
            Command ${command?.settings.name ?? commandName.toLowerCase()} has been enabled ${item instanceof Role || item instanceof User ? 'for' : 'in'} ${item}!
            `));
        } else {
            return message.channel.send(this.Embed.fail('An unexpected error occurred!'));
        }
    }
}
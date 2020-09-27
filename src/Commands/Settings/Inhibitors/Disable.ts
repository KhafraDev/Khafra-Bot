import { Command } from "../../../Structures/Command";
import { Message, Role, TextChannel, NewsChannel, User, Guild } from "discord.js";

import { pool } from "../../../Structures/Database/Mongo";
import KhafraClient from "../../../Bot/KhafraBot";

const blacklistedFolders = [ 'Settings', 'Moderation' ];

export default class extends Command {
    constructor() {
        super(
            [
                'Disable a command in a guild or channel or for a role or user!',
                'for guild say', 'for role @role badmeme', 'for user @Khafra#0001 ban', 'for channel #general badmeme',
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'disable',
                folder: 'Settings',
                args: [3, 4],
                guildOnly: true,
                aliases: [ 'blacklist', 'denylist', 'deny' ]
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(this.Embed.missing_perms.call(this, true));
        } 

        const [ f, type, mentionOrID, commandName ] = args;
        const id = type !== 'guild' ? mentionOrID?.replace(/[^\d]/g, '') : null;

        if(f !== 'for' && f !== 'in') {
            return message.channel.send(this.Embed.generic('First argument must be "for" or "in"!'));
        } else if(!['guild', 'role', 'user', 'channel'].includes(type.toLowerCase())) {
            return message.channel.send(this.Embed.generic('Second argument must be guild | user | role | channel!'));
        } else if(args.length !== 4 && !id) {
            return message.channel.send(this.Embed.generic('An ID must be provided if type isn\'t guild!'));
        } else if(args.length === 4 && type === 'guild') {
            return message.channel.send(this.Embed.fail('No ID should be provided when disabling for the guild!'));
        } else if(type !== 'guild' && id.length < 17 || id.length > 19) {
            return message.channel.send(this.Embed.generic(`Invalid ${type} ID or mention!`));
        } 

        const command = type === 'guild' ? KhafraClient.Commands.get(mentionOrID.toString()) : KhafraClient.Commands.get(commandName.toLowerCase());
        if(blacklistedFolders.includes(command?.settings.folder)) {
            return message.channel.send(this.Embed.fail(`Cannot deny commands in ${blacklistedFolders.join(' and ')} folders!`));
        }

        let item: Role | TextChannel | NewsChannel | User | Guild;
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
        } else {
            item = message.guild;
        }

        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');

        const inserted = await collection.updateOne(
            { id: message.guild.id },
            { $addToSet: {
                disabled: {
                    command: command?.settings.name ?? commandName.toLowerCase(),
                    aliases: command?.settings.aliases ?? null,
                    type,
                    id: item.id
                }
            } },
            { upsert: true }
        );

        if(inserted.modifiedCount === 1 || inserted.upsertedCount === 1) {
            return message.channel.send(this.Embed.success(`
            Command ${command?.settings.name ?? commandName} has been disabled ${item instanceof Role || item instanceof User ? 'for' : 'in'} ${item}!
            `));
        } else {
            return message.channel.send(this.Embed.fail('An unexpected error occurred!'));
        }
    }
}
import { Command } from "../../../Structures/Command";
import { Message, Role, TextChannel, NewsChannel, User, Guild } from "discord.js";
import Embed from "../../../Structures/Embed";
import { pool } from "../../../Structures/Database/Mongo";
import KhafraClient from "../../../Bot/KhafraBot";

const blacklistedFolders = [ 'Settings', 'Moderation' ];

export default class extends Command {
    constructor() {
        super(
            [
                'Re-allow a command in a guild or channel or for a role or user!',
                'for guild say', 'for role @role badmeme', 'for user @Khafra#0001 ban', 'for channel #general badmeme',
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'undisable',
                folder: 'Settings',
                args: [3, 4],
                guildOnly: true,
                aliases: [ 'unblacklist', 'undenylist', 'undeny' ]
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
        const id = type !== 'guild' ? mentionOrID?.replace(/[^\d]/g, '') : null;

        if(f !== 'for' && f !== 'in') {
            return message.channel.send(Embed.missing_args.call(this, 'First argument must be "for" or "in"!'));
        } else if(!['guild', 'role', 'user', 'channel'].includes(type.toLowerCase())) {
            return message.channel.send(Embed.missing_args.call(this, 'Second argument must be guild | user | role | channel!'));
        } else if(args.length !== 4 && !id) {
            return message.channel.send(Embed.missing_args.call(this, 'An ID must be provided if type isn\'t guild!'));
        } else if(args.length === 4 && type === 'guild') {
            return message.channel.send(Embed.fail('No ID should be provided when disabling for the guild!'));
        } else if(type !== 'guild' && id.length < 17 || id.length > 19) {
            return message.channel.send(Embed.missing_args.call(this, `Invalid ${type} ID or mention!`));
        } 

        const command = type === 'guild' ? KhafraClient.Commands.get(mentionOrID.toString()) : KhafraClient.Commands.get(commandName.toLowerCase());
        if(!command) {
            return message.channel.send(Embed.fail('No command to disable!'));
        } else if(blacklistedFolders.includes(command.settings.folder)) {
            return message.channel.send(Embed.fail(`Commands in ${blacklistedFolders.join(' and ')} folders cannot be denied!`));
        }

        let item: Role | TextChannel | NewsChannel | User | Guild;
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
        } else {
            item = message.guild;
        }

        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');

        const inserted = await collection.updateOne(
            { id: message.guild.id },
            { $pull: {
                disabled: {
                    command: command.settings.name,
                    type,
                    id: item.id
                }
            } }
        );

        if(inserted.modifiedCount === 1 || inserted.upsertedCount === 1) {
            return message.channel.send(Embed.success(`
            Command ${command.settings.name} has been re-allowed ${item instanceof Role || item instanceof User ? 'for' : 'in'} ${item}!
            `));
        } else {
            return message.channel.send(Embed.fail('An unexpected error occurred!'));
        }
    }
}
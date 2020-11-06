import { Command } from "../../../../Structures/Command.js";
import { Message } from "discord.js";
import { pool } from "../../../../Structures/Database/Mongo.js";
import { KhafraClient } from "../../../../Bot/KhafraBot.js";
import { getMentions, validSnowflake } from "../../../../lib/Utility/Mentions.js";
import { GuildSettings } from "../../../../lib/types/Collections.js";

const c = [ 'Settings', 'Server' ];

export default class extends Command {
    constructor() {
        super(
            [
                'Disable a command (or all) for a user.',
                '@shoue#0101',
                '@shoue#0101 badmeme',
                '165930518360227842',
                '165930518360227842 badmeme'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'disableuser',
                folder: 'Settings',
                args: [1, 2],
                guildOnly: true,
                aliases: [ 'blacklistuser', 'denyuser' ]
            }
        );
    }

    async init(message: Message, args: string[], settings: GuildSettings) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(this.Embed.missing_perms(true));
        } 

        let user = getMentions(message, args, { type: 'members' });
        if(!user || (typeof user === 'string' && !validSnowflake(user))) {
            return message.channel.send(this.Embed.generic());
        }

        const id = typeof user === 'string' ? user : user.id;

        let command: string[];
        if(args.length === 1) {
            command = ['*'];
        } else {
            if(!KhafraClient.Commands.has(args[1].toLowerCase())) {
                return message.channel.send(this.Embed.fail('No command with that name found!'));
            }

            const cmd = KhafraClient.Commands.get(args[1].toLowerCase());
            if(c.includes(cmd.settings.folder)) {
                return message.channel.send(this.Embed.fail('Can\'t disable commands in this category!'));
            }
            command = [].concat(cmd.settings.name, ...(cmd.settings.aliases ?? []));
        }

        if(settings?.disabledUser?.some(u => 
            u.names.includes(command[0]) && u.id === user.id
        )) {
            return message.channel.send(this.Embed.fail(`Command is already disabled for this user!`));
        }

        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');

        const inserted = await collection.updateOne(
            { id: message.guild.id },
            { 
                $push: {
                    disabledUser: {
                        main: command[0],
                        names: command,
                        id
                    }
                }
            },
            { upsert: true }
        );

        if(inserted.modifiedCount === 1 || inserted.upsertedCount === 1) {
            return message.channel.send(this.Embed.success(`
            Command ${command[0]} has been disabled for ${user}!
            `));
        } else {
            return message.channel.send(this.Embed.fail('An unexpected error occurred!'));
        }
    }
}
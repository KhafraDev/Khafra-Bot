import { Command } from "../../../../Structures/Command.js";
import { Message } from "discord.js";
import { pool } from "../../../../Structures/Database/Mongo.js";
import { KhafraClient } from "../../../../Bot/KhafraBot.js";
import { GuildSettings } from "../../../../lib/types/Collections.js";

const c = [ 'Settings', 'Server' ];

export default class extends Command {
    constructor() {
        super(
            [
                'Disable a command (or all) in a guild.',
                'badmeme',
                ''
            ],
			{
                name: 'disable',
                folder: 'Settings',
                args: [0, 1],
                guildOnly: true,
                aliases: [ 'blacklist', 'deny' ]
            }
        );
    }

    async init(message: Message, args: string[], settings: GuildSettings) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.reply(this.Embed.missing_perms(true));
        } 

        let command: string[];
        if(args.length === 0) {
            command = ['*'];
        } else {
            if(!KhafraClient.Commands.has(args[0].toLowerCase())) {
                return message.reply(this.Embed.fail('No command with that name found!'));
            }

            const cmd = KhafraClient.Commands.get(args[0].toLowerCase());
            if(c.includes(cmd.settings.folder)) {
                return message.reply(this.Embed.fail('Can\'t disable commands in this category!'));
            }
            command = [].concat(cmd.settings.name, ...(cmd.settings.aliases ?? []));
        }

        if(settings?.disabledGuild?.some(c => c.names.includes(command[0]))) {
            return message.reply(this.Embed.fail(`Command is already disabled in this guild!`));
        }

        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');

        const inserted = await collection.updateOne(
            { id: message.guild.id },
            { 
                $push: {
                    disabledGuild: {
                        main: command[0],
                        names: command
                    }
                }
            },
            { upsert: true }
        );

        if(inserted.modifiedCount === 1 || inserted.upsertedCount === 1) {
            return message.reply(this.Embed.success(`
            Command ${command[0]} has been disabled in the guild!
            `));
        } else {
            return message.reply(this.Embed.fail('An unexpected error occurred!'));
        }
    }
}
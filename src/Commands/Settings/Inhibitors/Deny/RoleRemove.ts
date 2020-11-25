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
                'Disable a command (or all) for a role.',
                '@nerds',
                '@nerds badmeme',
                '769345383293255750',
                '769345383293255750 badmeme'
            ],
			{
                name: 'undisablerole',
                folder: 'Settings',
                args: [1, 2],
                guildOnly: true,
                aliases: [ 'unblacklistrole', 'undenyrole' ]
            }
        );
    }

    async init(message: Message, args: string[], settings: GuildSettings) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.reply(this.Embed.missing_perms(true));
        } 

        let role = getMentions(message, args, { type: 'roles' });
        if(!role || (typeof role === 'string' && !validSnowflake(role))) {
            return message.reply(this.Embed.generic());
        } else if(typeof role === 'string' && message.guild.roles.cache.has(role)) {
            role = message.guild.roles.cache.get(role);
        }

        if(!role) {
            return message.reply(this.Embed.fail('Invalid Role!'));
        } else if(role.deleted) { // might as well
            return message.reply(this.Embed.fail('Deleted Role!'));
        }

        let command: string[];
        if(args.length === 1) {
            command = ['*'];
        } else {
            if(!KhafraClient.Commands.has(args[1].toLowerCase())) {
                return message.reply(this.Embed.fail('No command with that name found!'));
            }

            const cmd = KhafraClient.Commands.get(args[1].toLowerCase());
            if(c.includes(cmd.settings.folder)) {
                return message.reply(this.Embed.fail('Can\'t disable commands in this category!'));
            }
            command = [].concat(cmd.settings.name, ...(cmd.settings.aliases ?? []));
        }

        if(!settings?.disabledRole?.some(c => 
            c.names.includes(command[0]) && c.id === role.id
        )) {
            return message.reply(this.Embed.fail(`Command isn't disabled for this role!`));
        }

        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');

        const inserted = await collection.updateOne(
            { id: message.guild.id },
            { 
                $pull: {
                    disabledRole: {
                        main: command[0],
                        id: role.id
                    }
                }
            },
            { upsert: true }
        );

        if(inserted.modifiedCount === 1 || inserted.upsertedCount === 1) {
            return message.reply(this.Embed.success(`
            Command ${command[0]} has been re-enabled for ${role}!
            `));
        } else {
            return message.reply(this.Embed.fail('An unexpected error occurred!'));
        }
    }
}
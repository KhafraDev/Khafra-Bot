import { Command } from "../../Structures/Command.js";
import { Message } from "discord.js";
import { pool } from "../../Structures/Database/Mongo.js";

export default class extends Command {
    constructor() {
        super(
            [ 
                'GuildSettings: Change the prefix for the current guild.',
                '>>', '!!', '?'
            ],
			{
                name: 'prefix',
                folder: 'Settings',
                args: [1, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.reply(this.Embed.missing_perms(true));
        }

        if(args[0].replace(/[A-z0-9]/g, '').length !== args[0].length) {
            return message.reply(this.Embed.fail(`
            Only non-alphanumeric characters are allowed!
            `));
        }

        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');

        const updated = await collection.updateOne(
            { id: message.guild.id },
            { $set: {
                prefix: args[0]
            } },
            { upsert: true }
        );

        if(updated.upsertedCount === 1 || updated.modifiedCount === 1) {
            return message.reply(this.Embed.success(`
            Changed prefix to \`\`${args[0]}\`\`!
            `));
        } else {
            return message.reply(this.Embed.fail(`
            An unexpected error occurred!
            `));
        }
    }
}
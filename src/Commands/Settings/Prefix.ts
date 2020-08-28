import { Command } from "../../Structures/Command";
import { Message, MessageMentions } from "discord.js";
import Embed from "../../Structures/Embed";
import { pool } from "../../Structures/Database/Mongo";

export default class extends Command {
    constructor() {
        super(
            [ 
                'GuildSettings: Change the prefix for the current guild.',
                '>>', '!!', '?'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'prefix',
                folder: 'Settings',
                cooldown: 5,
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(Embed.missing_perms.call(this, true));
        } else if(args.length < 1) {
            return message.channel.send(Embed.missing_args.call(this, 1));
        }

        if(args[0].replace(/[A-z0-9]/g, '').length !== args[0].length) {
            return message.channel.send(Embed.fail(`
            Only non-alphanumeric characters are allowed!
            `));
        } else if(
            MessageMentions.ROLES_PATTERN.test(args[0])      || // role mention
            MessageMentions.USERS_PATTERN.test(args[0])      || // user mention
            MessageMentions.CHANNELS_PATTERN.test(args[0])   || // is a channel mention
            /<?(a)?:?(\w{2,32}):(\d{17,19})>?/.test(args[0])    // custom emoji
        ) {
            return message.channel.send(Embed.fail(`
            A mention cannot be a role mention, user mention, channel mention, or custom emoji.
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
            return message.channel.send(Embed.success(`
            Changed prefix to \`\`${args[0]}\`\`!
            `));
        } else {
            return message.channel.send(Embed.fail(`
            An unexpected error occurred!
            `));
        }
    }
}
import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import { pool } from "../../Structures/Database/Mongo";

export default class extends Command {
    constructor() {
        super(
            [
                'Set the number of warns to kick a user.',
                '20'
            ],
            [ 'KICK_MEMBERS' ], // no point in warning people if Khafra-Bot can't kick them
            {
                name: 'setwarn',
                folder: 'Moderation',
                args: [1, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(this.Embed.missing_perms.call(this, true));
        }

        const points = !isNaN(+args[0]) && Number.isSafeInteger(+args[0]) ? +args[0] : 20;
        const client = await pool.moderation.connect();
        const collection = client.db('khafrabot').collection('moderation');

        const updated = await collection.updateOne(
            { id: message.guild.id },
            {
                $set: { limit: points }
            },
            { upsert: true }
        );

        if(updated.modifiedCount > 0 || updated.upsertedCount > 0) {
            return message.channel.send(this.Embed.success(`
            Limit was updated! It will now take ${args[0]} warning points for a user to be kicked from a guild automatically!
            `));
        } else {
            return message.channel.send(this.Embed.fail('Limit wasn\'t updated. Are you sure it changed?'));
        }
    }
}
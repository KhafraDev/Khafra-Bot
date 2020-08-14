import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import { pool } from "../../Structures/Database/Mongo";
import Embed from "../../Structures/Embed";

export default class extends Command {
    constructor() {
        super(
            { name: 'insightsinit', folder: 'Insights' },
            [
                'Insights: Start having Khafra-Bot track new members, lurkers, and chatters!',
                ''
            ],
            [ /* No extra perms needed */ ],
            60,
            [ 'insightinit' ]
        );
    }

    async init(message: Message) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(Embed.missing_perms.call(this, true));
        }

        const client = await pool.insights.connect();
        const collection = client.db('khafrabot').collection('insights');

        const value = await collection.updateOne(
            { id: message.guild.id },
            {
                $setOnInsert: {
                    id: message.guild.id,
                    daily: {}
                }
            },
            { upsert: true }
        );

        if(value.upsertedCount === 1) {
            return message.channel.send(Embed.success(`
            Insights are now accessible in this guild!
            `));
        } else {
            return message.channel.send(Embed.fail('An unexpected error occurred! Insights are likely already enabled.'));
        }
    }
}
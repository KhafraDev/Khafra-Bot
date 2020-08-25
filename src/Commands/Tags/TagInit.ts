import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import Embed from "../../Structures/Embed";
import { pool } from "../../Structures/Database/Mongo";

export default class extends Command {
    constructor() {
        super(
            [
                'Tags: start using tags!',
                ''
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'tagsinit',
                folder: 'Tags',
                aliases: [ 'taginit' ],
                cooldown: 300,
                guildOnly: true
            }
        );
    }

    async init(message: Message) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(Embed.missing_perms.call(this, true));
        }

        const client = await pool.tags.connect();
        const collection = client.db('khafrabot').collection('tags');

        const value = await collection.updateOne(
            { id: message.guild.id },
            {
                $setOnInsert: {
                    id: message.guild.id,
                    tags: {}
                }
            },
            { upsert: true }
        )

        if(value.result.ok) {
            return message.channel.send(Embed.success(`
            Tags are now accessible in this guild!
            `));
        }
    }
}
import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import Embed from "../../Structures/Embed";
import { Mongo } from "../../Structures/Database/Mongo";

export default class extends Command {
    constructor() {
        super(
            'taginit',
            [
                'Tags: start using tags!',
                ''
            ],
            [ /* No extra perms needed */ ],
            300, // only needs to be done once, so
            [ 'tagsinit' ]
        );
    }

    async init(message: Message) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(Embed.missing_perms(this.permissions, true));
        }

        const client = await Mongo.connect();
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
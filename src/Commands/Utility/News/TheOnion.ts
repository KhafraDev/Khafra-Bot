import { Command } from "../../../Structures/Command.js";
import { Message } from "discord.js";
import { pool } from "../../../Structures/Database/Mongo.js";

import { articlesFromSitemap } from "../../../lib/Backend/TheOnion/TheOnion.js";
import { Onion } from "../../../lib/types/Collections";

let fetching = false;
let updated = false;

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch a random article from TheOnion!',
                ''
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'theonion',
                folder: 'News',
                args: [0, 0],
                aliases: [ 'onion' ] 
            }
        );
    }
    
    async init(message: Message) {
        if(fetching) {
            return message.channel.send(this.Embed.success('Articles are being fetched for the first time. Please wait a few minutes!'));
        }

        const client = await pool.commands.connect();
        const collection = client.db('khafrabot').collection('theonion');

        if(!updated) {
            const exists = await collection.findOne({});
            if(!exists) {
                message.channel.startTyping();
                fetching = true;
                const items = await articlesFromSitemap();
                await collection.insertMany(items);
                fetching = false;
                message.channel.stopTyping(true);
            }

            updated = true;
        }

        const random = await collection.aggregate<Onion>([ { $sample: { size: 1 } } ]).toArray();
        return message.channel.send(this.Embed.success(`[${random[0].title}](${random[0].href})`));
    }
}
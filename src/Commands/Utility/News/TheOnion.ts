import { Command } from "../../../Structures/Command";
import { Message } from "discord.js";
import { pool } from "../../../Structures/Database/Mongo";
import Embed from "../../../Structures/Embed";
import { articlesFromSitemap } from "../../../lib/Backend/TheOnion/TheOnion";
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
                cooldown: 7,
                aliases: [ 'onion' ] 
            }
        );
    }
    
    async init(message: Message) {
        if(fetching) {
            return message.channel.send(Embed.fail('Articles are being fetched for the first time. Please wait a few minutes!'));
        }

        const client = await pool.commands.connect();
        const collection = client.db('khafrabot').collection('theonion');

        if(!updated) {
            const exists = await collection.findOne({});
            if(!exists) {
                message.channel.startTyping();
                fetching = true;
                const items = await articlesFromSitemap() as Onion[];
                await collection.insertMany(items);
                fetching = false;
                message.channel.stopTyping(true);
            }

            updated = true;
        }

        const random = await collection.aggregate([ { $sample: { size: 1 } } ]).toArray() as Onion[];
        return message.channel.send(Embed.success(`[${random[0].title}](${random[0].href})`));
    }
}
import { Command } from "../../../Structures/Command.js";
import { Message } from "discord.js";
import { pool } from "../../../Structures/Database/Mongo.js";
import { OnionArticle } from "../../../lib/Backend/TheOnion/TheOnion.js";
import { updating } from "./TheOnionNew.js";

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
        if(updating) {
            return message.channel.send(this.Embed.fail(`
            Articles are being fetched for the first time or are being updated.

            Please give it a few minutes and try again!
            `));
        }

        const client = await pool.commands.connect();
        const collection = client.db('khafrabot').collection('theonion');

        const random = await collection.aggregate<OnionArticle>([ { $sample: { size: 1 } } ]).next();
        if(!random) {
            return message.channel.send(this.Embed.fail(`
            No Onion articles in database, please ask my owner to run \`\`theonionfetch\`\`!
            `));
        }
        
        return message.channel.send(this.Embed.success(`
        [${random.title}](${random.href})
        `).setTimestamp(random.date));
    }
}
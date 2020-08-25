import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import Embed from "../../Structures/Embed";
import { pool } from "../../Structures/Database/Mongo";
import { insert } from "../../lib/Backend/RollingStones";
import { RollingStones } from "../../lib/types/Collections";

let exists = false;

export default class extends Command {
    constructor() {
        super(
            [
                'Search stuff on the Rolling Stone\'s top 500 songs.',
                'The Beatles'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'rollingstones',
                folder: 'Utility',
                cooldown: 5
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(args.length === 0) {
            return message.channel.send(Embed.missing_args.call(this, 1));
        }

        const client = await pool.commands.connect();
        const collection = client.db('khafrabot').collection('rollingstones');
        if(!exists) {
            const item = await collection.findOne({}) as RollingStones;
            if(!item) {
                // this is a promise but it never resolves
                message.channel.startTyping();
                await insert();
                message.channel.stopTyping(true);
            }

            exists = true;
        }

        const query = !isNaN(+args[0]) 
            ? { place: +args[0] }
            // safe regex: first 100 characters only (prevent DOS hopefully)
            // and all non-alphanumeric + commas are replaced
            : { title: new RegExp(args.join(' ').slice(0, 100).replace(/[^A-z0-9,\s]/g, ''), 'i') }

        const search = await collection.findOne(query) as RollingStones;
        if(!search) {
            return message.channel.send(Embed.fail(`No results found!`));
        }

        const embed = Embed.success(search.bio.slice(0, 2048))
            .setThumbnail(search.image)
            .setTitle(`${search.place}: ${search.title}`)
            .setFooter(search.permalink)

        return message.channel.send(embed);
    }
}
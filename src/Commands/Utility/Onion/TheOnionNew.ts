import { Command } from "../../../Structures/Command.js";
import { Message } from "discord.js";
import { pool } from "../../../Structures/Database/Mongo.js";
import { getArticles, OnionArticle, months } from "../../../lib/Backend/TheOnion/TheOnion.js";

export let updating = false;

export default class extends Command {
    constructor() {
        super(
            [
                'Clear The Onion article collection and refetch.',
                '', 'force'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'theonionnew',
                folder: 'News',
                args: [0, 1],
                aliases: [ 'onionnew', 'theonionfetch' ],
                ownerOnly: true 
            }
        );
    }
    
    async init(message: Message, args: string[]) {
        const client = await pool.commands.connect();
        const collection = client.db('khafrabot').collection<OnionArticle>('theonion');

        if(args.length === 1) {
            message.channel.startTyping();
            updating = true;
            await collection.deleteMany({});
            const articles = await getArticles();
            await collection.insertMany(articles.articles);

            message.channel.stopTyping();
            updating = false;
            return message.channel.send(this.Embed.success(`
            Fetched and inserted ${articles.articles.length} articles into the collection.
            There were ${articles.errors.length} error(s).
            `));
        }

        const last = await collection.find().sort({ $natural: -1 }).limit(1).next();
        if(last && !('date' in last)) {
            return message.channel.send(this.Embed.fail(`
            This option is only available in the newer collection format.

            Run this command with any argument to reformat the collection.
            `));
        }

        const map = [];
        if(last && 'date' in last) {
            for(let i = last.date.getFullYear(); i <= new Date().getFullYear(); i++) {
                for(
                    let m = i === last.date.getFullYear() ? last.date.getMonth() + 1 : 1;
                    m <= 12;
                    m++
                ) {
                    map.push(`https://local.theonion.com/sitemap/${i}/${months[m]}`)
                }
            }
        }
        
        message.channel.startTyping();
        const articles = await getArticles(map.length ? map : null);
        await collection.insertMany(articles.articles);
        message.channel.stopTyping();

        return message.channel.send(this.Embed.success(`
        Fetched and inserted ${articles.articles.length} articles into the collection.
        There were ${articles.errors.length} error(s).
        `));
    }
}
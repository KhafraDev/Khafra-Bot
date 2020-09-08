import { Event } from "../Structures/Event";
import { ClientEvents, GuildMember } from "discord.js";
import { pool } from "../Structures/Database/Mongo";
import { formatDate } from "../lib/Utility/Date";

export default class implements Event {
    name: keyof ClientEvents = 'guildMemberAdd';

    async init(member: GuildMember) {        
        const date = formatDate('MM-DD-YYYY', new Date());
        const client = await pool.insights.connect();
        const collection = client.db('khafrabot').collection('insights');
            
        collection.updateOne(
            { id: member.guild.id },
            { $inc: { 
                [`daily.${date}.total`]: 1,
                [`daily.${date}.joined`]: 1
            } },
            { upsert: true }
        );
    }
}
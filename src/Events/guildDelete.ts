import { Event } from '../Structures/Event.js';
import { pool } from '../Structures/Database/Mongo.js';
import { Guild } from 'discord.js';
import { RegisterEvent } from '../Structures/Decorator.js';

@RegisterEvent
export class kEvent extends Event {
    name = 'guildDelete' as const;

    async init(guild: Guild) {
        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');

        await collection.deleteOne({
            id: guild.id
        });
    }
}
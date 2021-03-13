import { Event } from '../Structures/Event.js';
import { pool } from '../Structures/Database/Mongo.js';
import { Guild } from 'discord.js';
import config from '../../config.json';
import { RegisterEvent } from '../Structures/Decorator.js';

@RegisterEvent
export class kEvent extends Event {
    name = 'guildCreate' as const;

    async init(guild: Guild) {
        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');

        await collection.insertOne({
            id: guild.id,
            prefix: config.prefix,
            roleReacts: [],
            commandRole: [],
            disabledGuild: [],
            enabledGuild: [],
            welcomeChannel: guild.systemChannel,
            modActionLogChannel: null,
            rules: {
                channel: null,
                rules: [] 
            }
        });
    }
}
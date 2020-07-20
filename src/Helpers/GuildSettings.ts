import { Snowflake, Message } from 'discord.js';
import db from '../Structures/Database';

/**
 * Settings cache
 */
const GC = new Map();

type reacts = {
    id: string;
    emoji:  string;
    chance: string;      
};

type react_messages = {
    id: string;
    content: string;
    emoji: string;
    role: string;
};

interface dbGuild {
    id: string;
    owner_id: string; 
    custom_commands: any, // not yet implemented 
    reacts: reacts[];
    react_messages: react_messages[];
    prefix: string;
}

const dbHelpers = {
    /**
     * Get an existing value from the database
     */
    get: (id: Snowflake): dbGuild => {
        if(dbHelpers.isCached(id)) {
            return GC.get(id);
        }

        const row: dbGuild = db.prepare('SELECT * FROM guilds WHERE id = ? LIMIT 1').get(id);
        if(row) {
            for(const prop in Object.assign(Object.create(null), row)) {
                if(row[prop].startsWith('[') && row[prop].endsWith(']')) { // array like
                    row[prop] = JSON.parse(row[prop]);
                }
            }

            return GC.set(row.id, row).get(row.id);
        }
    },
    /**
     * Insert a new entry into the database
     */
    set: (message: Message) => {
        return db.prepare(`INSERT OR IGNORE INTO guilds (
                id, 
                owner_id,
                custom_commands,
                reacts,
                react_messages,
                prefix
            ) 
            values (
                @id, 
                @owner_id, 
                @custom_commands, 
                @reacts, 
                @react_messages,
                @prefix
            )`).run({ 
                id:                 message.guild.id, 
                owner_id:           message.guild.ownerID,
                custom_commands:    JSON.stringify([]),
                reacts:             JSON.stringify([]),
                react_messages:     JSON.stringify([]),
                prefix:             '!'
        });
    },
    /**
     * Updates the server's prefix
     */
    updatePrefix: (newPrefix: string, id: string ) => {
        const query = `UPDATE guilds SET prefix = ? WHERE id = ?`;
        const value = db.prepare(query).run(newPrefix, id);

        if(dbHelpers.isCached(id) && value.changes === 1) {
            const old = GC.get(id);
            old.prefix = newPrefix;

            GC.set(id, old);
        }

        return value;
    },
    /**
     * Update custom reactions for messages.
     */
    updateReacts: (reacts: string, id: string) => {
        const query = `UPDATE guilds SET reacts = ? WHERE id = ?`;
        const value = db.prepare(query).run(reacts, id);

        if(dbHelpers.isCached(id) && value.changes === 1) {
            const old = GC.get(id);
            old.reacts = JSON.parse(reacts);

            GC.set(id, old);
        }

        return value;
    },
    /**
     * Update message roles
     */
    updateMessageRoles: (react_messages: string, id: string) => {
        const query = `UPDATE guilds SET react_messages = ? WHERE id = ?`;
        const value = db.prepare(query).run(react_messages, id);

        if(dbHelpers.isCached(id) && value.changes === 1) {
            const old = GC.get(id);
            old.react_messages = JSON.parse(react_messages);

            GC.set(id, old);
        }

        return value;
    },
    /**
     * Check cache 
     */
    isCached: (id: Snowflake): boolean => {
        return GC.has(id);
    }
}

export { dbHelpers, dbGuild, react_messages, reacts };
import { Snowflake, Message } from 'discord.js';
import { RunResult } from 'better-sqlite3';
import db from './Database';

/**
 * Settings cache
 */
const GC = new Map();

const dbHelpers = {
    /**
     * Get an existing value from the database
     */
    get: (id: Snowflake) => {
        if(dbHelpers.isCached(id)) {
            return GC.get(id);
        }

        const row = db.prepare('SELECT * FROM guilds WHERE id = ?').get([ id ]);
        if(row) {
            GC.set(row.id, row);
        }

        return row;
    },
    /**
     * Insert a new entry into the database
     */
    set: (message: Message): RunResult => {
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
                custom_commands:    JSON.stringify({}),
                reacts:             JSON.stringify({}),
                react_messages:     JSON.stringify({}),
                prefix:             '!'
        });
    },
    update: ({ where, kvPair }: { where: string[], kvPair: string[] } ) => {
        GC.delete(where[1]);
        const query = `UPDATE guilds SET ${kvPair.shift()} = ? WHERE ${where.shift()} = ?`;
        return db.prepare(query).run(kvPair.shift(), where.shift());
    },
    /**
     * Check cache 
     */
    isCached: (id: Snowflake): boolean => {
        return GC.has(id);
    }
}

export { dbHelpers };
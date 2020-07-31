import { Snowflake, Message } from 'discord.js';
import db from '../../Structures/Database/SQLite';
import { dbGuild } from '../types/db.i';

/**
 * Settings cache
 */
const GC: Map<Snowflake, dbGuild> = new Map();

const dbHelpers = {
    /**
     * Get an existing value from the database
     */
    get: (id: Snowflake, columns?: string): dbGuild => {
        if(dbHelpers.isCached(id)) {
            return GC.get(id);
        }

        const row: dbGuild = db.prepare(`SELECT ${columns ?? '*'} FROM guilds WHERE id = ? LIMIT 1`).get(id);
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
        return db.prepare(
            `INSERT OR IGNORE INTO guilds (
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
            )`
        ).run({ 
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
     * Update message roles
     */
    updateList: (custom_commands: string, id: string) => {
        const query = `UPDATE guilds SET custom_commands = ? WHERE id = ?`;
        const value = db.prepare(query).run(custom_commands, id);

        if(dbHelpers.isCached(id) && value.changes === 1) {
            const old = GC.get(id);
            old.custom_commands = JSON.parse(custom_commands);

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

export { dbHelpers };
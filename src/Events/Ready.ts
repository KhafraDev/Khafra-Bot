import { Event } from "../Structures/Event";
import db from "../Structures/Database/SQLite";
import { ClientEvents } from "discord.js";

export default class implements Event {
    name: keyof ClientEvents = 'ready';

    init() {
        console.log('Logged in!');
    
        const shouldCreateTable = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='guilds' LIMIT 1;`).get() === undefined;
        if(shouldCreateTable) {
            db.prepare(`CREATE TABLE IF NOT EXISTS guilds (
                id TEXT PRIMARY KEY, 
                owner_id TEXT,
                custom_commands TEXT,
                reacts TEXT,
                react_messages TEXT,
                prefix TEXT,
                UNIQUE(id));
            `).run();
        }
    
        db.pragma('journal_mode = wal');
        db.pragma('cache_size = -4000'); // default|suggested = -2000
        console.log('Table is now setup!\n');
    }
}
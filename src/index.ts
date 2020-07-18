import KhafraClient from './Bot/KhafraBot';
import Command from './Structures/Command';

import db from './Structures/GuildSettings/Database';

import loadEnv from './Helpers/load.env';
import { dbHelpers } from './Structures/GuildSettings/GuildSettings';
loadEnv();

const client = new KhafraClient({
    disableMentions: 'everyone',
    presence: {
        status: 'online'
    },
    messageCacheLifetime: 1800, // defaults to never..
    messageSweepInterval: 1800  // defaults to never..
}, process.env.TOKEN);

client.on('ready', () => {
    console.log('Logged in!');

    const created = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='guilds';`).get() === undefined;
    if(created) {
        db.prepare(`CREATE TABLE IF NOT EXISTS guilds (
            id TEXT PRIMARY KEY, 
            owner_id TEXT,
            custom_commands TEXT,
            reacts TEXT,
            react_messages TEXT,
            prefix TEXT,
            UNIQUE(id));
        `).run();
        db.pragma('synchronous = 1');
        db.pragma('journal_mode = wal');
    }

    console.log('Table is now setup!');
});

client.on('message', message => {
    if(!Command.Sanitize(message)) {
        return;
    }

    const split = message.content.split(/\s+/g);
    // don't split a single string if there are no arguments
    const [cmd, ...args] = split.length > 1 ? split : [split].flat();

    const settings = dbHelpers.get(message.guild.id);
    const prefix = settings?.prefix ?? '!';
    const command = cmd.slice(prefix.length);

    if(!cmd.startsWith(prefix)) {
        return;
    }

    if(!KhafraClient.Commands.has(command)) {
        return;
    }

    return KhafraClient.Commands.get(command).init(message, args);
});

client.init();
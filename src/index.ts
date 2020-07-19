import KhafraClient from './Bot/KhafraBot';
import Command from './Structures/Command';

import db from './Structures/GuildSettings/Database';

import loadEnv from './Helpers/load.env';
import { dbHelpers } from './Structures/GuildSettings/GuildSettings';
import { PermissionString } from 'discord.js';
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

    if(settings?.reacts) {
        const botPerms = message.guild.me.permissions;
        const hasPerms = [ 'ADD_REACTIONS', 'READ_MESSAGE_HISTORY' ].every((p: PermissionString) => botPerms.has(p));
        if(!hasPerms) {
            return;
        }

        //const reacts = {}.toString.call(settings.reacts) === '[object Array]' ? settings.reacts : JSON.parse(settings.reacts);
        const user = settings.reacts.filter((r: any) => r.id === message.author.id).pop();

        if(user) {
            const chance = Math.floor(Math.random() * 100 + 1) <= +user.chance;
            if(chance) {
                try {
                    message.react(user.emoji.replace(/\\/g, '')); // SQLite sanitizes input, in this case by adding backslashes.
                } catch {} // doesn't really matter if this fails.
            }
        }
    }

    if(!cmd.startsWith(prefix)) {
        return;
    }

    if(!KhafraClient.Commands.has(command)) {
        return;
    }

    return KhafraClient.Commands.get(command).init(message, args);
});

client.init();
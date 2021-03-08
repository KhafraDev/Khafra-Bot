import './lib/Utility/load.env.js';
import './lib/Utility/Rejections.js';

import { KhafraClient } from './Bot/KhafraBot.js';
import { Logger } from './Structures/Logger.js';
import { trim } from './lib/Utility/Template.js';
import { ClientEvents } from 'discord.js';

const logger = new Logger('RateLimit');

const emitted = <T extends keyof ClientEvents>(name: T) => {
    return (...args: ClientEvents[T]) => 
        KhafraClient.Events.get(name)?.init(...args);
}

export const client = new KhafraClient({
    allowedMentions: { parse: [ 'users', 'roles' ], repliedUser: true },
    presence: { status: 'online' },
    messageCacheLifetime: 1800, // defaults to never..
    messageSweepInterval: 1800, // defaults to never..
    partials: [ 'REACTION', 'MESSAGE', 'USER' ],
    intents: [ 
        'DIRECT_MESSAGES',
        'GUILDS', 
        'GUILD_EMOJIS',
        'GUILD_MEMBERS', 
        'GUILD_MESSAGES', 
        'GUILD_MESSAGE_REACTIONS',
        'GUILD_PRESENCES' 
    ]
})
    .on('ready',                 emitted('ready'))
    .on('message',               emitted('message'))
    .on('guildCreate',           emitted('guildCreate'))
    .on('guildDelete',           emitted('guildDelete'))
    .on('guildMemberAdd',        emitted('guildMemberAdd'))
    .on('guildMemberRemove',     emitted('guildMemberRemove'))
    .on('guildMemberUpdate',     emitted('guildMemberUpdate'))
    .on('rateLimit', data => {
        logger.log(trim`
        Timeout: ${data.timeout} 
        | Limit: ${data.limit} 
        | HTTP Method: ${data.method} 
        | Route: ${data.route} 
        | Path: ${data.path}
        `);
    });

client.init();
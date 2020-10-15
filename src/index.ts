import './lib/Utility/Rejections';
import './Structures/Proxy/ChannelSend';
import './Structures/Proxy/React';

import { KhafraClient } from './Bot/KhafraBot';
import { loadEnv } from './lib/Utility/load.env';
import { Logger } from './Structures/Logger';
import { trim } from './lib/Utility/Template';
import { ClientEvents } from 'discord.js';
loadEnv();

const logger = new Logger('RateLimit');

const emitted = (name: keyof ClientEvents) => {
    return (...args: ClientEvents[keyof ClientEvents]) => 
        KhafraClient.Events.get(name)?.init(...args);
}

const client = new KhafraClient({
    disableMentions: 'everyone',
    presence: {
        status: 'online'
    },
    messageCacheLifetime: 1800, // defaults to never..
    messageSweepInterval: 1800, // defaults to never..
    partials: [ 'REACTION', 'MESSAGE', 'USER' ],
    ws: {
        intents: [ 'GUILDS', 'GUILD_MEMBERS', 'GUILD_PRESENCES', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'DIRECT_MESSAGES' ]
    }
})
    .on('ready',                 emitted('ready'))
    .on('message',               emitted('message'))
    .on('messageReactionAdd',    emitted('messageReactionAdd'))
    .on('messageReactionRemove', emitted('messageReactionRemove'))
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
import './lib/Utility/load.env.js';
import './lib/Utility/Rejections.js';
import './Structures/Proxy/ChannelSend.js';
import './Structures/Proxy/React.js';
import './Structures/Proxy/Edit.js';
import './Structures/Proxy/Reply.js';

import { KhafraClient } from './Bot/KhafraBot.js';
import { Logger } from './Structures/Logger.js';
import { trim } from './lib/Utility/Template.js';
import { ClientEvents } from 'discord.js';

if(process.env.__KONG_USERNAME && process.env.__KONG_PASSWORD) {
    await import('./lib/Backend/Kongregate.js');
}

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

export { client };
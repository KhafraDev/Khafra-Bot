import './lib/Utility/Rejections';
import './Structures/Proxy/ChannelSend';
import './Structures/Proxy/React';

import KhafraClient from './Bot/KhafraBot';
import loadEnv from './lib/Utility/load.env';
import { Logger } from './Structures/Logger';
loadEnv();

const logger = new Logger('RateLimit');

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
    .on('ready', () => KhafraClient.Events.get('ready').init())
    .on('message', message => KhafraClient.Events.get('message').init(message))
    .on('messageReactionAdd', (reaction, user) => KhafraClient.Events.get('messageReactionAdd').init(reaction, user))
    .on('messageReactionRemove', (reaction, user) => KhafraClient.Events.get('messageReactionRemove').init(reaction, user))
    .on('guildMemberAdd', member => KhafraClient.Events.get('guildMemberAdd').init(member))
    .on('guildMemberRemove', member => KhafraClient.Events.get('guildMemberRemove').init(member))
    .on('guildMemberUpdate', (o, n) => KhafraClient.Events.get('guildMemberUpdate').init(o, n))
    .on('rateLimit', data => {
        logger.log(`
        Timeout: ${data.timeout} 
        | Limit: ${data.limit} 
        | HTTP Method: ${data.method} 
        | Route: ${data.route} 
        | Path: ${data.path}
        `.split(/\n\r|\n|\r/g).map(e => e.trim()).join(' ').trim());
    });

client.init();
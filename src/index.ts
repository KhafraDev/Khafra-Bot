import KhafraClient from './Bot/KhafraBot';
import loadEnv from './Backend/Utility/load.env';
loadEnv();

const client = new KhafraClient({
    disableMentions: 'everyone',
    presence: {
        status: 'online'
    },
    messageCacheLifetime: 1800, // defaults to never..
    messageSweepInterval: 1800, // defaults to never..
    partials: [ 'REACTION', 'MESSAGE', 'USER' ]
})
    .on('ready', () => KhafraClient.Events.get('ready').init())
    .on('message', message => KhafraClient.Events.get('message').init(message))
    .on('messageReactionAdd', (reaction, user) => KhafraClient.Events.get('messageReactionAdd').init(reaction, user))
    .on('messageReactionRemove', (reaction, user) => KhafraClient.Events.get('messageReactionRemove').init(reaction, user))
    .on('guildMemberAdd', member => KhafraClient.Events.get('guildMemberAdd').init(member))
    .on('guildMemberRemove', member => KhafraClient.Events.get('guildMemberRemove').init(member))

client.init();
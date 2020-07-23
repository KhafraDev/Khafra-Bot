import KhafraClient from './Bot/KhafraBot';
import loadEnv from './Helpers/load.env';
loadEnv();

const client = new KhafraClient({
    disableMentions: 'everyone',
    presence: {
        status: 'online'
    },
    messageCacheLifetime: 1800, // defaults to never..
    messageSweepInterval: 1800, // defaults to never..
    partials: [ 'REACTION', 'MESSAGE', 'USER' ]
});

client.on('ready', () => KhafraClient.Events.get('ready').init());
client.on('message', message => KhafraClient.Events.get('message').init(message));
client.on('messageReactionAdd', (reaction, user) => KhafraClient.Events.get('messageReactionAdd').init(reaction, user));
client.on('messageReactionRemove', (reaction, user) => KhafraClient.Events.get('messageReactionRemove').init(reaction, user));

client.init();
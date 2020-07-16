import KhafraClient from './Bot/KhafraBot';
import Command from './Structures/Command';
import loadEnv from './Structures/Helpers/load.env';
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
});

client.on('message', message => {
    if(!Command.Sanitize(message)) {
        return;
    }

    const split = message.content.split(/\s+/g);
    // don't split a single string if there are no arguments
    const [command, ...args] = split.length > 1 ? split : [split].flat();

    if(!KhafraClient.Commands.has(command)) {
        return;
    }

    return KhafraClient.Commands.get(command).init(message, args);
});

client.init();
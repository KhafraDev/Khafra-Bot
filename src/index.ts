import './lib/Utility/load.env.js';
import './lib/Utility/Rejections.js';

import { KhafraClient } from './Bot/KhafraBot.js';
import { Awaited, ClientEvents, Intents } from 'discord.js';

const emitted = <T extends keyof ClientEvents>(name: T) => {
    return (...args: ClientEvents[T]) => 
        KhafraClient.Events.get(name)?.init(...args) as Awaited<void>;
}

export const client = new KhafraClient({
    allowedMentions: { parse: [ 'users', 'roles' ], repliedUser: true },
    presence: { status: 'online' },
    messageCacheLifetime: 1800, // defaults to never..
    messageSweepInterval: 1800, // defaults to never..
    partials: [ 'REACTION', 'MESSAGE', 'USER' ],
    intents: [ 
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_BANS,
        Intents.FLAGS.GUILD_EMOJIS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_PRESENCES
    ]
})
    .on('ready',                emitted('ready'))
    .on('messageCreate',        emitted('messageCreate'))
    .on('guildBanAdd',          emitted('guildBanAdd'))
    .on('guildBanRemove',       emitted('guildBanRemove'))
    .on('guildCreate',          emitted('guildCreate'))
    .on('guildDelete',          emitted('guildDelete'))
    .on('interactionCreate',    emitted('interactionCreate'))
    .on('guildMemberAdd',       emitted('guildMemberAdd'))
    .on('guildMemberRemove',    emitted('guildMemberRemove'))
    .on('guildMemberUpdate',    emitted('guildMemberUpdate'))
    .on('rateLimit',            emitted('rateLimit'))

    .on('emojiCreate',          emitted('emojiCreate'))
    .on('emojiDelete',          emitted('emojiDelete'))
    .on('emojiUpdate',          emitted('emojiUpdate'))
    .on('roleCreate',           emitted('roleCreate'))
    .on('roleDelete',           emitted('roleDelete'))
    .on('roleUpdate',           emitted('roleUpdate'))

void client.init();
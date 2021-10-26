import './lib/Utility/load.env.js';
import './lib/Utility/Rejections.js';
import './lib/Utility/Timers/Giveaways.js';

import { KhafraClient } from './Bot/KhafraBot.js';
import { ClientEvents, Intents, Options, LimitedCollection } from 'discord.js';
import { dontThrow } from './lib/Utility/Don\'tThrow.js';

const emitted = <T extends keyof ClientEvents>(name: T) => {
    return (...args: ClientEvents[T]): void => 
        void dontThrow(KhafraClient.Events.get(name)!.init(...args) as Promise<unknown>);
}

export const client = new KhafraClient({
    allowedMentions: { parse: [ 'users', 'roles' ], repliedUser: true },
    presence: { status: 'online' },
    makeCache: Options.cacheWithLimits({
        MessageManager: {
            sweepFilter: LimitedCollection.filterByLifetime({
                lifetime: 1800
            }),
            sweepInterval: 1800
        },
        ThreadManager: {
            sweepFilter: LimitedCollection.filterByLifetime({
                excludeFromSweep: (thread) => !thread.archived,
            }),
            sweepInterval: 1800
        }
    }),
    partials: [ 'MESSAGE', 'USER' ],
    intents: [
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_BANS,
        Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
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
    .on('rateLimit',            emitted('rateLimit'));

void client.init();
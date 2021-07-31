import './lib/Utility/load.env.js';
import './lib/Utility/Rejections.js';
import './lib/Utility/Timers/Giveaways.js';

import { KhafraClient } from './Bot/KhafraBot.js';
import { ClientEvents, Intents, Options, SweptCollection } from 'discord.js';
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
            sweepFilter: SweptCollection.filterByLifetime({
                lifetime: 1800
            }),
            sweepInterval: 1800
        },
        ThreadManager: {
            sweepFilter: SweptCollection.filterByLifetime({
                excludeFromSweep: (thread) => !(thread as import('discord.js').ThreadChannel).archived,
            }),
            sweepInterval: 1800
        }
    }),
    partials: [ 'REACTION', 'MESSAGE', 'USER' ],
    intents: [ 
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
    .on('rateLimit',            emitted('rateLimit'))

    .on('channelCreate',        emitted('channelCreate'))
    .on('channelDelete',        emitted('channelDelete'))
    .on('channelUpdate',        emitted('channelUpdate'))
    .on('emojiCreate',          emitted('emojiCreate'))
    .on('emojiDelete',          emitted('emojiDelete'))
    .on('emojiUpdate',          emitted('emojiUpdate'))
    .on('roleCreate',           emitted('roleCreate'))
    .on('roleDelete',           emitted('roleDelete'))
    .on('roleUpdate',           emitted('roleUpdate'))

void client.init();
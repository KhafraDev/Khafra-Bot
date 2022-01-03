import '#khaf/utility/load.env.js';
import '#khaf/utility/Rejections.js';
import '#khaf/utility/Timers/Giveaways.js';

import { KhafraClient } from '#khaf/Bot';
import type { Event } from '#khaf/Event';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { AllowedMentionsTypes, PresenceUpdateStatus } from 'discord-api-types/v9';
import { ClientEvents, Intents, Options, Sweepers } from 'discord.js';


const emitted = <T extends keyof ClientEvents>(name: T) => {
    let event: Event<keyof ClientEvents> | undefined;

    return (...args: ClientEvents[T]) => {
        if (!event) {
            if (!KhafraClient.Events.has(name)) {
                throw new Error(`The ${name} event has no event handler!`);
            }

            event = KhafraClient.Events.get(name)!;
        }

        void dontThrow(event.init(...args));
    }
}

export const client = new KhafraClient({
    allowedMentions: {
        parse: [ AllowedMentionsTypes.Role, AllowedMentionsTypes.User ],
        repliedUser: true
    },
    presence: { status: PresenceUpdateStatus.Online },
    makeCache: Options.cacheWithLimits({
        MessageManager: {
            sweepFilter: Sweepers.filterByLifetime({
                lifetime: 1800
            }),
            sweepInterval: 1800
        },
        ThreadManager: {
            sweepFilter: Sweepers.filterByLifetime({
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
    .on('messageUpdate',        emitted('messageUpdate'))
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
import '#khaf/utility/load.env.js';
import '#khaf/utility/Rejections.js';
import '#khaf/utility/__proto__.js';
import '#khaf/utility/ImageFonts.js';

import { KhafraClient } from '#khaf/Bot';
import { Event } from '#khaf/Event';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { RestEvents } from '@discordjs/rest';
import { AllowedMentionsTypes, GatewayIntentBits, PresenceUpdateStatus } from 'discord-api-types/v10';
import { ClientEvents, Partials } from 'discord.js';

const emitted = <T extends keyof ClientEvents | keyof RestEvents>(
    name: T
): (...args: Parameters<Event['init']>) => void => {
    let event: Event;

    return (...args: Parameters<typeof event['init']>): void => {
        event ??= KhafraClient.Events.get(name)!;
        return void dontThrow(event.init(...args));
    }
}

export const client = new KhafraClient({
    allowedMentions: {
        parse: [AllowedMentionsTypes.Role, AllowedMentionsTypes.User],
        repliedUser: true
    },
    presence: { status: PresenceUpdateStatus.Online },
    partials: [Partials.Message, Partials.User],
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences
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
    .on('guildMemberUpdate',    emitted('guildMemberUpdate'));

client.rest.on('rateLimited', emitted('rateLimited'));

void client.init();
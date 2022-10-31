import '#khaf/utility/load.env.js'
import '#khaf/utility/Rejections.js'
import '#khaf/utility/__proto__.js'
import '#khaf/image/ImageFonts.js'

import { KhafraClient } from '#khaf/Bot'
import type { Event } from '#khaf/Event'
import { RESTEvents, type RestEvents } from '@discordjs/rest'
import { AllowedMentionsTypes, GatewayIntentBits, PresenceUpdateStatus } from 'discord-api-types/v10'
import { type ClientEvents, Partials, Events, Options } from 'discord.js'
import { logError } from '#khaf/utility/Rejections.js'

const emitted = <T extends keyof ClientEvents | keyof RestEvents>(
  name: T
): (...args: Parameters<Event['init']>) => void => {
  let events: Event[]

  return (...args: Parameters<typeof events[number]['init']>): void => {
    events ??= KhafraClient.Events.get(name) ?? []

    for (const event of events) {
      event.init(...args).catch(logError)
    }
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
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent
  ],
  makeCache: Options.cacheWithLimits({
    MessageManager: 10,
    GuildStickerManager: 0,
    GuildScheduledEventManager: 0,
    StageInstanceManager: 0,
    VoiceStateManager: 0
  })
})
  .on(Events.ClientReady,         emitted(Events.ClientReady))
  .on(Events.MessageCreate,       emitted(Events.MessageCreate))
  .on(Events.GuildBanAdd,         emitted(Events.GuildBanAdd))
  .on(Events.GuildBanRemove,      emitted(Events.GuildBanRemove))
  .on(Events.GuildCreate,         emitted(Events.GuildCreate))
  .on(Events.GuildDelete,         emitted(Events.GuildDelete))
  .on(Events.InteractionCreate,   emitted(Events.InteractionCreate))
  .on(Events.GuildMemberAdd,      emitted(Events.GuildMemberAdd))
  .on(Events.GuildMemberRemove,   emitted(Events.GuildMemberRemove))
  .on(Events.GuildMemberUpdate,   emitted(Events.GuildMemberUpdate))

client.rest.on(RESTEvents.RateLimited, emitted(RESTEvents.RateLimited))

void client.init()

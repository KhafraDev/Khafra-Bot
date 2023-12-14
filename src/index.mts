import '#khaf/image/ImageFonts.mjs'
import '#khaf/utility/Rejections.mjs'

import { KhafraClient } from '#khaf/Bot'
import type { Event } from '#khaf/Event'
import { logger } from '#khaf/Logger'
import { RESTEvents, type RestEvents } from '@discordjs/rest'
import { AllowedMentionsTypes, GatewayIntentBits, PresenceUpdateStatus } from 'discord-api-types/v10'
import { type ClientEvents, Events, Options, Partials } from 'discord.js'

const emitted = <T extends keyof ClientEvents | keyof RestEvents>(
  name: T
): (...args: Parameters<Event['init']>) => void => {
  let events: Event | undefined

  return async (...args: Parameters<Event['init']>): Promise<void> => {
    events ??= KhafraClient.Events.get(name)!

    try {
      await events.init(...args)
    } catch (e) {
      logger.error(e, `error in ${name} event`)
    }
  }
}

const client = new KhafraClient({
  allowedMentions: {
    parse: [AllowedMentionsTypes.Role, AllowedMentionsTypes.User],
    repliedUser: true
  },
  presence: { status: PresenceUpdateStatus.Online },
  partials: [Partials.Message, Partials.User],
  intents: [
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildModeration,
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
  .on(Events.ClientReady, emitted(Events.ClientReady))
  .on(Events.MessageCreate, emitted(Events.MessageCreate))
  .on(Events.GuildBanAdd, emitted(Events.GuildBanAdd))
  .on(Events.GuildBanRemove, emitted(Events.GuildBanRemove))
  .on(Events.GuildCreate, emitted(Events.GuildCreate))
  .on(Events.GuildDelete, emitted(Events.GuildDelete))
  .on(Events.InteractionCreate, emitted(Events.InteractionCreate))
  .on(Events.GuildMemberAdd, emitted(Events.GuildMemberAdd))
  .on(Events.GuildMemberRemove, emitted(Events.GuildMemberRemove))
  .on(Events.GuildMemberUpdate, emitted(Events.GuildMemberUpdate))
  .on(Events.GuildAuditLogEntryCreate, emitted(Events.GuildAuditLogEntryCreate))

client.rest.on(RESTEvents.RateLimited, emitted(RESTEvents.RateLimited))

void client.init()

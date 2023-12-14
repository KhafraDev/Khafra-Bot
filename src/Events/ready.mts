import { join } from 'node:path'
import { type Client, Events } from 'discord.js'
import type { Event } from '#khaf/Event'
import { logger } from '#khaf/structures/Logger.mjs'
import { Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { cwd } from '#khaf/utility/Constants/Path.mjs'
import { createFileWatcher } from '#khaf/utility/FileWatcher.mjs'
import { validSnowflake } from '#khaf/utility/Mentions.mjs'

const config = createFileWatcher<typeof import('../../config.json')>(join(cwd, 'config.json'))

export class kEvent implements Event {
  name = Events.ClientReady as const

  async init(client: Client<true>): Promise<void> {
    const s = `Logged in at ${new Date()}`
    logger.info(s)

    if (typeof config.botOwner === 'string') {
      if (!validSnowflake(config.botOwner)) {
        return logger.warn('Logged in, configuration bot owner is not a valid Snowflake!')
      }

      const user = await client.users.fetch(config.botOwner)
      const sentMessage = await user
        .send({
          embeds: [Embed.ok(s)]
        })
        .then(
          () => true,
          () => false
        )

      if (!sentMessage) {
        logger.warn('Logged in! Could not send message to the bot owner.')
      }
    }

    await client.application.commands.fetch().catch((err) => logger.error(err, 'error fetching commands'))
  }
}

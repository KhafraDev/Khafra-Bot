import type { RateLimitData } from '@discordjs/rest'
import type { Event } from '#khaf/Event'
import { logger } from '#khaf/structures/Logger.mjs'

export class kEvent implements Event {
  name = 'rateLimited' as const

  init(data: RateLimitData): Promise<void> {
    logger.warn({ rateLimitData: data }, 'ratelimit')
    return Promise.resolve()
  }
}

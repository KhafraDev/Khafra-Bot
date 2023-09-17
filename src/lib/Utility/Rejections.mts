import { sql as PostgresClient } from '#khaf/database/Postgres.mjs'
import { TwitterScraper } from '#khaf/functions/twitter/scraper.mjs'
import { logger } from '#khaf/structures/Logger.mjs'
import process, { exit } from 'node:process'

type EventNames = NodeJS.UncaughtExceptionOrigin | NodeJS.Signals

const cleanup = async (event: EventNames, error?: unknown): Promise<void> => {
  if (error !== undefined) {
    logger.error(error, event)
  }

  await PostgresClient.end({ timeout: 5 })
  await TwitterScraper.browserInstance?.close()

  process.nextTick(() => exit(1))
}

process.on('SIGTERM', (signal) => void cleanup(signal))
process.on('SIGINT', (signal) => void cleanup(signal))
process.on('uncaughtException', (error) => void cleanup('uncaughtException', error))
process.on('unhandledRejection', (error: unknown) => void cleanup('unhandledRejection', error))

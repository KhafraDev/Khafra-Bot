import { client as DiscordClient } from '#khaf/Client'
import { sql as PostgresClient } from '#khaf/database/Postgres.js'
import { logger } from '#khaf/structures/Logger.js'
import process, { exit } from 'node:process'

type EventNames = NodeJS.UncaughtExceptionOrigin | NodeJS.Signals

const cleanup = async (event: EventNames, error?: unknown): Promise<never> => {
    if (error !== undefined) {
        logger.error(error, event)
    }

    await PostgresClient.end({ timeout: 5 })
    DiscordClient.destroy()

    exit(1)
}

process.on('SIGTERM', (signal) => void cleanup(signal))
process.on('SIGINT', (signal) => void cleanup(signal))
process.on('uncaughtException', (error) => void cleanup('uncaughtException', error))
process.on('unhandledRejection', (error: unknown) => void cleanup('unhandledRejection', error))

export const logError = (err: Error): Error => {
    Error.captureStackTrace(err, logError)
    logger.error(err)
    return err
}
import { client as DiscordClient } from '#khaf/Client'
import { sql as PostgresClient } from '#khaf/database/Postgres.js'
import { logger } from '#khaf/structures/Logger.js'
import { once } from '#khaf/utility/Memoize.js'
import process, { exit } from 'node:process'

const cleanup = once(async (...args: [unknown?, unknown?]) => {
    if (args.length !== 0) {
        const obj = {}
        Error.captureStackTrace(obj)

        logger.debug({
            args,
            stack: `${Reflect.get(obj, 'stack')}`
        })
    }

    await PostgresClient.end({ timeout: 5 })
    DiscordClient.destroy()
    logger.flush()

    exit(1)
})

for (const event of [
    'SIGTERM',
    'SIGINT',
    'SIGBREAK',
    'SIGHUP',
    'uncaughtException',
    'unhandledRejection'
]) {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    process.once(event, cleanup)
}

export const logError = (err: Error): Error => {
    Error.captureStackTrace(err, logError)
    logger.error(err)
    return err
}
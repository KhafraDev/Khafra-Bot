import { logger } from '#khaf/structures/Logger/FileLogger.js'

interface Options {
    logOnFail?: boolean
}

/**
 * Resolves a promise without throwing an error.
 * @example
 * declare const message: import('discord.js').Message;
 * const [err, res] = await dontThrow(message.channel.send({ content: 'Hello, world!' }));
 */
export async function dontThrow<T = unknown>(
    promise: Promise<T>,
    options: Options = {
        logOnFail: true
    }
): Promise<[null, T] | [Error, null]> {
    let err: Error | void

    try {
        return [null, await promise]
    } catch (e) {
        err = e as Error
        return [err, null]
    } finally {
        if (err && options.logOnFail) {
            Error.captureStackTrace(err, dontThrow)
            logger.error(err, 'error in dontThrow utility')
        }
    }
}
import { logger } from '#khaf/structures/Logger.js'

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
  try {
    return [null, await promise]
  } catch (e) {
    if (options.logOnFail && e instanceof Error) {
      Error.captureStackTrace(e, dontThrow)
      logger.error(e, 'error in dontThrow')
    }

    return [e as Error, null]
  }
}

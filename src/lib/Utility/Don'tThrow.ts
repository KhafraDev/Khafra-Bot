import { Logger } from '#khaf/Logger';

const logger = new Logger();

/**
 * Resolves a promise without throwing an error.
 * @example
 * declare const message: import('discord.js').Message;
 * const [err, res] = await dontThrow(message.channel.send({ content: 'Hello, world!' })); 
 */
 export async function dontThrow<T = unknown>(
    promise: Promise<T>
): Promise<
    Readonly<[null, T]> |
    Readonly<[Error, null]>
> {
    let err: Error | void;

    try {
        return [null, await promise];
    } catch (e) {
        err = e as Error;
        return [err, null];
    } finally {
        if (err) {
            logger.warn(`An error occurred but was caught.`, err);
        }
    }
}
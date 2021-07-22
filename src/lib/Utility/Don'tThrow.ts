import { types } from 'util';

type FromPromise<T extends unknown> = T extends Promise<infer U>
    ? U
    : T;

/**
 * Resolves a promise without throwing an error.
 * @example
 * declare const message: import('discord.js').Message;
 * const [err, res] = await dontThrow(message.channel.send({ content: 'Hello, world!' })); 
 */
export const dontThrow = async <T extends Promise<unknown> | unknown>(promise: T): Promise<[Error | null, FromPromise<T> | null]> => {
    try {
        const ret: FromPromise<T> = types.isPromise(promise) ? await promise : promise;
        return [null, ret];
    } catch (e) {
        return [e, null];
    }
}
type FromPromise<T extends unknown> = T extends Promise<infer U>
    ? U
    : never;

/**
 * Resolves a promise without throwing an error.
 * @example
 * declare const message: import('discord.js').Message;
 * const [err, res] = await dontThrow(message.channel.send({ content: 'Hello, world!' })); 
 */
export const dontThrow = async <T extends Promise<unknown>>(promise: T): Promise<[Error | null, FromPromise<T> | null]> => {
    try {
        const ret = await promise;
        return [null, ret as FromPromise<T>];
    } catch (e) {
        return [e, null];
    }
}
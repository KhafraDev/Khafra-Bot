/* eslint-disable @typescript-eslint/ban-types */

import { types } from 'util';
import { Logger } from '../../Structures/Logger.js';

const logger = new Logger('WARN');

type FromPromise<T> = T extends Promise<infer U> ? U : T;

/**
 * Resolves a promise without throwing an error.
 * @example
 * declare const message: import('discord.js').Message;
 * const [err, res] = await dontThrow(message.channel.send({ content: 'Hello, world!' })); 
 */
export async function dontThrow<Ret>(fn: Function, args: unknown[]): Promise<[Error, Ret]>;
export async function dontThrow<T extends Promise<unknown>>(promise: T): Promise<[Error, FromPromise<T>]>;
export async function dontThrow<T extends Promise<unknown>>(promise: T | Function, args?: unknown[]) {
    if (promise === undefined) return [null, undefined];
    let err: Error | void;

    try {
        const ret = args && args.length > 0 && typeof promise === 'function' && !types.isPromise(promise)
            ? <FromPromise<T>>promise(...args) 
            : <FromPromise<T>>(types.isPromise(promise) ? await promise : promise);

        return [null as unknown as Error, ret];
    } catch (e: unknown) {
        err = e as Error;
        return [e as Error, null as unknown as FromPromise<T>];
    } finally {
        if (err) {
            logger.log(`An error occurred but was caught.`, err);
        }
    }
}
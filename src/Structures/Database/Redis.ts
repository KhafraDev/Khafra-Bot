import redis, { RedisClient } from 'redis';
import { promisify } from 'util';

type RedisSet<R = unknown> =
    & ((key: string, value: string) => Promise<R>)
    & ((key: string, value: string, flag: string) => Promise<R>)
    & ((key: string, value: string, mode: string, duration: number) => Promise<R>)
    & ((key: string, value: string, mode: string, duration: number, flag: string) => Promise<R>)
    & ((key: string, value: string, flag: string, mode: string, duration: number) => Promise<R>);

type RedisGet = (...args: [string]) => Promise<string>;

const messageClient = redis.createClient();
const commandClient = redis.createClient();

/**
 * Promisifies some redisclient methods, retaining *good enough* typings.
 */
const Promisify = (client: RedisClient) => {
    const set: RedisSet = promisify(client.set).bind(client);
    const get: RedisGet = promisify(client.get).bind(client);

    return { get, set };
}

export const client = {
    message: { ...Promisify(messageClient) },
    commands: { ...Promisify(commandClient) }
}
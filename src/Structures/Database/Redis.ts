import redis, { OverloadedCommand, OverloadedSetCommand, RedisClient } from 'redis';
import { promisify } from 'util';

type RedisSet<R = unknown> =
    & ((key: string, value: string) => Promise<R>)
    & ((key: string, value: string, flag: string) => Promise<R>)
    & ((key: string, value: string, mode: string, duration: number) => Promise<R>)
    & ((key: string, value: string, mode: string, duration: number, flag: string) => Promise<R>)
    & ((key: string, value: string, flag: string, mode: string, duration: number) => Promise<R>);

type RedisGet = (...args: [string]) => Promise<string>;
type RedisExists<R = unknown> = OverloadedCommand<string, number, R>;
type RedisHSet<R = unknown> = OverloadedSetCommand<string, number, R>;
type RedisHGet<R = unknown> = (key: string, field: string) => R;

const messageClient = redis.createClient();
const commandClient = redis.createClient();

/**
 * Promisifies some redisclient methods, retaining *good enough* typings.
 */
const Promisify = (client: RedisClient) => {
    const set: RedisSet = promisify(client.set).bind(client);
    const get: RedisGet = promisify(client.get).bind(client);
    /** https://redis.io/commands/exists */
    const exists: RedisExists = promisify(client.exists).bind(client);
    const hset = promisify(client.hset).bind(client) as RedisHSet;
    const hget: RedisHGet = promisify(client.hget).bind(client);
    const hgetAll: RedisHGet = promisify(client.hgetall).bind(client);

    return { get, set, exists, hset, hget, hgetAll };
}

export const client = {
    message: { ...Promisify(messageClient) },
    commands: { ...Promisify(commandClient) }
}
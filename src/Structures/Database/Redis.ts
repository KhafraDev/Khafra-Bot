import redis from 'redis';
import { LRU } from '#khaf/LRU';

const messageClient = redis.createClient({
    database: 1,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) return new Error('Max attempts reached');

            return retries * 100;
        }
    }
});

await messageClient.connect();

const cache = new LRU<string, string>();

export const client = {
    get: async (key: string) => {
        const cachedItem = cache.get(key);
        if (cachedItem) return cachedItem;

        const item = await messageClient.get(key);
        if (item) cache.set(key, item);

        return item;
    },
    set: async (key: string, value: string, mode?: string, duration?: number) => {
        const options = mode && duration ? { [mode]: duration } : undefined;

        const item = await messageClient.set(key, value, options);
        if (item) cache.set(key, value);

        return item;
    },
    exit: () => messageClient.quit()
}
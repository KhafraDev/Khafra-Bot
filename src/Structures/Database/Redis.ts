import redis from 'redis';

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

export const client = {
    get: async (key: string) => {
        return await messageClient.get(key);
    },
    set: async (key: string, value: string, mode?: string, duration?: number) => {
        const options = mode && duration ? { [mode]: duration } : undefined;

        return await messageClient.set(key, value, options);
    }
}
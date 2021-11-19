import redis from 'redis';

const connect = `redis://localhost:6379`;
const messageClient = redis.createClient(`${connect}/1`, {
    retry_strategy(options) {
        if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
        } else if (options.attempt > 10) {
            return new Error('Max attempts reached');
        } else if (options.error?.code === 'ECONNREFUSED') {
            return 500;
        }

        return Math.min(options.attempt * 100, 3000);
    }
});

export const client = {
    get: (key: string) => {
        return new Promise<string | null>((res, rej) => {
            messageClient.get(key, (err, reply) => {
                if (err !== null) return rej(err);

                return res(reply);
            });
        });
    },
    set: (key: string, value: string, mode?: string, duration?: number) => {
        return new Promise<'OK'>((res, rej) => {
            if (typeof mode === 'string' && typeof duration === 'number') {
                messageClient.set(key, value, mode, duration, (err, reply) => {
                    if (err !== null) return rej(err);

                    return res(reply!);
                });
            } else {
                messageClient.set(key, value, (err, reply) => {
                    if (err !== null) return rej(err);

                    return res(reply);
                });
            }
        });
    }
}
import redis from 'redis';

const connect = `redis://localhost:6379`;
const messageClient = redis.createClient(`${connect}/1`);

export const client = {
    get: (key: string) => {
        return new Promise<string>((res, rej) => {
            messageClient.get(key, (err, reply) => {
                if (err !== null) return rej(err);

                return res(reply!);
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
    },
    exists: (key: string) => {
        return new Promise<0 | 1>((res, rej) => {
            messageClient.exists(key, (err, reply) => {
                if (err !== null) return rej(err);

                return res(reply as 0 | 1);
            });
        });
    }
}
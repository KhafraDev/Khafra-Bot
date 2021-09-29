import { fetch, Headers } from 'undici';
import crypto from 'crypto';
import type { PocketAddResults, PocketGetResults, PocketRateLimit } from './types/Pocket';

const limits: PocketRateLimit = {
    'x-limit-user-limit':     -1,   // Current rate limit enforced per user
    'x-limit-user-remaining': -1,   // Number of calls remaining before hitting user's rate limit
    'x-limit-user-reset':     -1,   // Seconds until user's rate limit resets
    'x-limit-key-limit':      -1,   // Current rate limit enforced per consumer key
    'x-limit-key-remaining':  -1,   // Number of calls remaining before hitting consumer key's rate limit
    'x-limit-key-reset':      -1    // Seconds until consumer key rate limit resets
}

class Pocket {
    consumer_key = process.env.POCKET_CONSUMER_KEY;

    redirect_uri?: string;
    request_token?: string;
    access_token?: string;
    username?: string;

    constructor(user?: { request_token: string, access_token: string, username: string }) {
        if (user) {
            this.request_token = this.decrypt(user.request_token);
            this.access_token = this.decrypt(user.access_token);
            this.username = user.username;
        }
    }

    /**
     * Pocket Authentication:
     * 
     * Step 2: Obtain a request token
     * @throws {Error} when status isn't 200
     */
    async requestCode() {
        const rateLimited = checkRateLimits();
        if (rateLimited) {
            throw new Error(
                `Rate-limited: 
                * ${limits['x-limit-key-reset']} seconds consumer key, 
                * ${limits['x-limit-user-reset']} seconds for the user.`
            );
        }

        const res = await fetch('https://getpocket.com/v3/oauth/request', {
            method: 'POST',
            headers: {
                'Host': 'getpocket.com',
                'Content-Type': 'application/json; charset=UTF-8',
                'X-Accept': 'application/json'
            },
            body: JSON.stringify({
                consumer_key: this.consumer_key,
                redirect_uri: this.redirect_uri
            })
        });

        setRateLimits(res.headers);
        if (!res.ok) {
            throw new Error(
                res.headers.get('X-Error-Code') + ': ' +
                res.headers.get('X-Error')
            )
        }

        const body = await res.json() as { code: string };
        this.request_token = body.code;
        return this.request_token;
    }

    /**
     * Authorization URL. User must authorize Khafra-Bot by clicking the link generated.
     * @throws {Error} if there is no request_token
     */
    get requestAuthorization() {
        return 'https://getpocket.com/auth/authorize?request_token=' + this.request_token + '&redirect_uri=' + this.redirect_uri;
    }

    async accessToken() {
        const rateLimited = checkRateLimits();
        if (rateLimited) {
            throw new Error(
                `Rate-limited: 
                * ${limits['x-limit-key-reset']} seconds consumer key, 
                * ${limits['x-limit-user-reset']} seconds for the user.`
            );
        }

        const res = await fetch('https://getpocket.com/v3/oauth/authorize', {
            method: 'POST',
            headers: {
                'Host': 'getpocket.com',
                'Content-Type': 'application/json; charset=UTF-8',
                'X-Accept': 'application/json'
            },
            body: JSON.stringify({
                consumer_key: this.consumer_key,
                code: this.request_token
            })
        });
    
        setRateLimits(res.headers);
        if (!res.ok) {
            throw new Error(
                res.headers.get('X-Error-Code') + ': ' +
                res.headers.get('X-Error')
            )
        }
    
        const body = await res.json() as { access_token: string, username: string };
        this.access_token = body.access_token;
        this.username =     body.username;
        return this.access_token;
    }

    async getList(): Promise<PocketGetResults> {
        const rateLimited = checkRateLimits();
        if (rateLimited) {
            throw new Error(
                `Rate-limited: 
                * ${limits['x-limit-key-reset']} seconds consumer key, 
                * ${limits['x-limit-user-reset']} seconds for the user.`
            );
        }
    
        const res = await fetch('https://getpocket.com/v3/get', {
            method: 'POST',
            headers: {
                'Host': 'getpocket.com',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                consumer_key: this.consumer_key,
                access_token: this.access_token,
                contentType: 'article',
                detailType: 'simple',
                sort: 'newest',
                count: 10
            })
        });
    
        setRateLimits(res.headers);
        if (!res.ok) {
            throw new Error(
                res.headers.get('X-Error-Code') + ': ' +
                res.headers.get('X-Error')
            )
        }
    
        return await res.json() as PocketGetResults;
    }

    async add(url: string | import('url').URL, title?: string) {
        const rateLimited = checkRateLimits();
        if (rateLimited) {
            throw new Error(
                `Rate-limited: 
                * ${limits['x-limit-key-reset']} seconds consumer key, 
                * ${limits['x-limit-user-reset']} seconds for the user.`
            );
        }
    
        const res = await fetch('https://getpocket.com/v3/add', {
            method: 'POST',
            headers: {
                'Host': 'getpocket.com',
                'Content-Type': 'application/json; charset=UTF-8',
                'X-Accept': 'application/json'
            },
            body: JSON.stringify({
                url: `${url}`,
                title,
                time: Date.now(),
                consumer_key: process.env.POCKET_CONSUMER_KEY,
                access_token: this.access_token
            })
        });
    
        setRateLimits(res.headers);
        if (!res.ok) {
            throw new Error(
                res.headers.get('X-Error-Code') + ': ' +
                res.headers.get('X-Error')
            )
        }
    
        return res.json() as Promise<PocketAddResults>;
    }

    encrypt = (text: string) => {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-ctr', process.env.POCKET_SECRET_KEY!, iv);
        const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

        return `${iv.toString('hex')}:${encrypted.toString('hex')}`;

    }

    decrypt = (hash: string) => {
        const [iv, content] = hash.split(':');
        const decipher = crypto.createDecipheriv('aes-256-ctr', process.env.POCKET_SECRET_KEY!, Buffer.from(iv, 'hex'));
        const decrpyted = Buffer.concat([decipher.update(Buffer.from(content, 'hex')), decipher.final()]);

        return decrpyted.toString();
    }

    toObject() {
        return {
            request_token: this.encrypt(this.request_token!),
            access_token: this.encrypt(this.access_token!),
            username: this.username
        }
    }
}

const setRateLimits = (headers: Headers) => {
    const keys = Object.keys(limits).map(k => k.toLowerCase());
    for (const [header, value] of Object.entries(headers)) {
        if (keys.includes(header.toLowerCase())) {
            limits[header.toLowerCase()] = +value;
        }
    }
}

const checkRateLimits = () => {
    if (limits['x-limit-key-remaining'] === 0) {
        return true;
    } else if (limits['x-limit-user-remaining'] === 0) {
        return true;
    }

    return false;
}

export { Pocket };
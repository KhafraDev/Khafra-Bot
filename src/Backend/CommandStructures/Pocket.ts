import fetch, { Headers } from 'node-fetch';

const limits = {
    'x-limit-user-limit':     -1,   // Current rate limit enforced per user
    'x-limit-user-remaining': -1,   // Number of calls remaining before hitting user's rate limit
    'x-limit-user-reset':     -1,   // Seconds until user's rate limit resets
    'x-limit-key-limit':      -1,   // Current rate limit enforced per consumer key
    'x-limit-key-remaining':  -1,   // Number of calls remaining before hitting consumer key's rate limit
    'x-limit-key-reset':      -1    // Seconds until consumer key rate limit resets
}

class Pocket {
    consumer_key: string = process.env.POCKET_CONSUMER_KEY;

    redirect_uri: string;
    request_token: string;
    access_token: string;
    username: string;

    /**
     * Pocket Authentication:
     * 
     * Step 2: Obtain a request token
     * @throws {Error} when status isn't 200
     */
    async requestCode() {
        const rateLimited = Pocket.checkRateLimits();
        if(rateLimited) {
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

        Pocket.setRateLimits(res.headers);
        if(!res.ok) {
            throw new Error(
                res.headers.get('X-Error-Code') + ': ' +
                res.headers.get('X-Error')
            )
        }

        const body = await res.json();
        this.request_token = body.code;
        return this.request_token;
    }

    /**
     * Authorization URL. User must authorize Khafra-Bot by clicking the link generated.
     * @throws {Error} if there is no request_token
     */
    get requestAuthorization() {
        if(!this.request_token) {
            throw new Error('request_token is null!');
        }
    
        return 'https://getpocket.com/auth/authorize?request_token=' + this.request_token + '&redirect_uri=' + this.redirect_uri;
    }

    async accessToken() {
        const rateLimited = Pocket.checkRateLimits();
        if(rateLimited) {
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
    
        Pocket.setRateLimits(res.headers);
        if(!res.ok) {
            throw new Error(
                res.headers.get('X-Error-Code') + ': ' +
                res.headers.get('X-Error')
            )
        }
    
        const body = await res.json();
        this.access_token = body.access_token;
        this.username =     body.username;
        return this.access_token;
    }

    static setRateLimits(headers: Headers) {
        const keys = Object.keys(limits).map(k => k.toLowerCase());
        for(const [header, value] of headers) {
            if(keys.includes(header.toLowerCase())) {
                limits[header.toLowerCase()] = value;
            }
        }
    }

    static checkRateLimits() {
        if(limits['x-limit-key-remaining'] === 0) {
            return true;
        } else if(limits['x-limit-user-remaining'] === 0) {
            return true;
        }

        return false;
    }

    toObject() {
        return {
            request_token: this.request_token,
            access_token: this.access_token,
            username: this.username
        }
    }
}

export const get = async (consumer_key: string, access_token: string) => {
    const rateLimited = Pocket.checkRateLimits();
    if(rateLimited) {
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
            consumer_key,
            access_token,
            contentType: 'article',
            detailType: 'simple',
            sort: 'newest',
            count: 10
        })
    });

    Pocket.setRateLimits(res.headers);
    if(!res.ok) {
        throw new Error(
            res.headers.get('X-Error-Code') + ': ' +
            res.headers.get('X-Error')
        )
    }

    return res.json();
}

export { Pocket };
import Fetch from 'node-fetch';
import { Headers, RequestInit } from 'node-fetch';

type HttpMethods = 
    | 'GET' 
    | 'HEAD' 
    | 'POST' 
    | 'PUT' 
    | 'DELETE' 
    | 'CONNECT' 
    | 'OPTIONS' 
    | 'TRACE' 
    | 'PATCH';

type _HeadersInit = string[][] | Headers | Record<string, string>;

class kFetchError extends Error {
    name = 'KhafraFetchError';
    constructor(m: string) {
        super(m);
    }
}

class Fetcher {
    method = 'GET';
    url: string;
    headers = new Headers();

    constructor(url?: string) {
        this.url = url;
    }

    /**
     * sets the http method to POST,
     * optionally set the url
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST
     */
    post(url?: string) {
        if (url) this.url = url;

        this.method = 'POST';
        return this;
    }

    /**
     * sets the http method to GET,
     * optionally set the url
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/GET
     */
    get(url?: string) {
        if (url) this.url = url;

        this.method = 'GET';
        return this;
    }

    /**
     * Changes the http method to a generic one,
     * optionally set the server to fetch
     * @param m Method to change to
     */
    setMethod(m: HttpMethods, url?: string) {
        if (url) this.url = url;

        this.method = m;
        return this;
    }

    setURL(url: string) {
        this.url = url;
        return this;
    }


    header(key: string, value: string): Fetcher;
    header(key: _HeadersInit): Fetcher;
    header(key: _HeadersInit | string, value?: string) {
        if (typeof key === 'string')
            this.headers.set(key, value);
        else 
            new Headers(key).forEach((value, key) => this.headers.set(key, value));
        
        return this;
    }

    send(opts: RequestInit = {}) {
        if (!this.url)
            throw new kFetchError('Fetch#send was called before setting a URL!');
            
        return Fetch(this.url, {
            method: this.method,
            headers: this.headers,
            ...opts
        });
    }

    async json<T extends any = any>() {
        const r = await this.send();
        return r.json() as T;
    }

    async text() {
        const r = await this.send();
        return r.text();
    }
}

export const fetch = (url?: string) => new Fetcher(url);
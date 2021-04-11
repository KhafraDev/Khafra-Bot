import { parse, validate, X2jOptionsOptional } from 'fast-xml-parser';
import fetch from 'node-fetch';
import { delay } from './Constants/OneLiners.js';

interface RSSJSON<T extends unknown> {
    rss: {
        channel: {
            title: string
            link: string
            description: string
            ttl?: number
            item: T[] | T
            // todo: add better typings that follow the rss specification
            [key: string]: unknown
        }
    }
}

interface AtomJSON<T extends unknown> {
    feed: {
        id: string
        title: string
        updated: string
        entry: T[] | T
        [key: string]: unknown
    }
}

export class RSSReader<T extends unknown> {
    private interval: NodeJS.Timeout | null = null;
    private options: X2jOptionsOptional = {};

    public results = new Set<T>();
    public timeout = 60 * 1000 * 60;
    public save = 10;
    public url = 'https://google.com/';

    public afterSave = () => {};

    /**
     * @param loadFunction function to run after RSS feed has been fetched and parsed.
     * @param options RSS reader options
     */
    constructor(loadFunction?: (() => void), options: X2jOptionsOptional = {}) {
        this.afterSave = loadFunction;
        this.options = options;
    }

    /**
     * Very rarely, a network/server side error will occur. This function retries requests
     * up to 10 times before giving up.
     */
    forceFetch = async () => {
        for (let i = 0; i < 10; i++) {
            try {
                const res = await fetch(this.url);
                return res;
            } catch {
                await delay(1000);
            }
        }
    }

    parse = async () => {
        const r = await this.forceFetch();
        const xml = await r?.text();

        if (typeof xml !== 'string' || validate(xml) !== true) 
            return console.log(validate(xml), this.url);
        this.results.clear();

        const j = parse(xml, this.options) as RSSJSON<T> | AtomJSON<T>;

        if (!('rss' in j) && !('feed' in j)) {
            return clearInterval(this.interval);
        }

        // respects a feed's ttl option if present.
        // https://www.rssboard.org/rss-draft-1#element-channel-ttl
        if ('rss' in j && typeof j.rss.channel.ttl === 'number') {
            clearInterval(this.interval);
            this.timeout = 60 * 1000 * j.rss.channel.ttl;
            if (this.timeout <= 0) this.timeout = 60 * 1000 * 60;

            this.interval = setInterval(
                this.parse, 
                this.timeout
            );
        }

        const i = 'rss' in j 
            ? j.rss.channel.item // RSS feed
            : j.feed.entry;      // Atom feed

        if (Array.isArray(i)) {
            for (const item of i.slice(0, this.save)) {
                this.results.add(item);
            }
        } else {
            this.results.add(i);
        }

        this.afterSave?.();
    }

    cache = async (url: string) => {
        if (this.interval) return this.interval;
        this.url = url;

        await this.parse();
        this.interval = setInterval(
            this.parse,
            this.timeout
        );
    }
}
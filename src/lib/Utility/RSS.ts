import { parse, validate, X2jOptionsOptional } from 'fast-xml-parser';
import { fetch } from '../../Structures/Fetcher.js';
import { delay } from './Constants/OneLiners.js';

interface RSSJSON<T extends any> {
    rss: {
        channel: {
            title: string
            link: string
            description: string
            ttl?: number
            item: T[]
            // todo: add better typings that follow the rss specification
            [key: string]: any
        }
    }
}

interface AtomJSON<T extends any> {
    feed: {
        id: string
        title: string
        updated: string
        entry: T[]
        [key: string]: any
    }
}

export class RSSReader<T extends any> {
    private interval: NodeJS.Timeout | null = null;
    private options: X2jOptionsOptional = {};

    public results = new Map<number, T>();
    public timeout = 60 * 1000 * 60;
    public save = 10;
    public url = 'https://google.com/'

    public afterSave = () => {};

    constructor(loadFunction?: (() => any), options: X2jOptionsOptional = {}) {
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
                const res = await fetch(this.url).send();
                return res;
            } catch {
                await delay(1000);
            }
        }
    }

    parse = async () => {
        const r = await this.forceFetch();
        const xml = await r?.text();

        if (typeof xml !== 'string' || validate(xml) !== true) return;
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
                this.results.set(this.results.size, item);
            }
        } else {
            this.results.set(this.results.size, i as T);
        }

        if (typeof this.afterSave === 'function') {
            this.afterSave();
        }
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
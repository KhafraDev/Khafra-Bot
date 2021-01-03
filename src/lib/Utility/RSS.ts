import { parse, validate } from 'fast-xml-parser';
import fetch from 'node-fetch';
import { promisify } from 'util';

const delay = promisify(setTimeout);

interface RSSJSON<T extends any> {
    rss: {
        channel: {
            title: string
            link: string
            description: string
            item: T[]
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

    public results = new Map<number, T>();
    public timeout = 60 * 1000 * 60;
    public save = 10;

    /**
     * Very rarely, a network/server side error will occur. This function retries requests
     * up to 10 times before giving up.
     * @param url {string} RSS feed to fetch
     */
    forceFetch = async (url: string) => {
        for(let i = 0; i < 10; i++) {
            try {
                const res = await fetch(url);
                return res;
            } catch {
                await delay(1000);
            }
        }
    }

    parse = async (url: string) => {
        const r = await this.forceFetch(url);
        const xml = await r.text();

        if(!validate(xml)) return;
        this.results.clear();

        const j = parse(xml) as RSSJSON<T> | AtomJSON<T>;
        const i = 'rss' in j 
            ? j.rss.channel.item // RSS feed
            : j.feed.entry;      // Atom feed

        for(const item of i.slice(0, this.save)) {
            this.results.set(this.results.size, item);
        }
    }

    cache = async (url: string) => {
        if(this.interval) return this.interval;

        await this.parse(url).catch(() => {});
        this.interval = setInterval(
            () => this.parse(url).catch(() => {}),
            this.timeout
        );
    }
}
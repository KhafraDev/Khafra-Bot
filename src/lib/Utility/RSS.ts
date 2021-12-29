import { X2jOptionsOptional, XMLParser, XMLValidator } from 'fast-xml-parser';
import { join } from 'path';
import { clearInterval, setInterval, setTimeout } from 'timers';
import { fetch } from 'undici';
import { delay } from './Constants/OneLiners.js';
import { cwd } from './Constants/Path.js';
import { createFileWatcher } from './FileWatcher.js';
import { validateNumber } from './Valid/Number.js';

const config = createFileWatcher({} as typeof import('../../../package.json'), join(cwd, 'package.json'));

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop: (() => void | Promise<void>) = () => {};
const syUpdateFrequency = ['hourly', 'daily', 'weekly', 'monthly', 'yearly'] as const;
const ms = {
    hourly: 3.6e+6,
    daily: 8.64e+7,
    weekly: 6.048e+8,
    monthly: 2.628e+9,
    yearly: 3.154e+10
} as const;

interface RSSJSON<T> {
    rss: {
        channel: {
            title: string
            link: string
            description: string
            ttl?: number
            'sy:updatePeriod': number
            'sy:updateFrequency': typeof syUpdateFrequency[number]
            item: T[] | T
            [key: string]: unknown
        }
    }
}

interface AtomJSON<T> {
    feed: {
        id: string
        title: string
        updated: string
        entry: T[] | T
        [key: string]: unknown
    }
}

export class RSSReader<T> {
    #interval: NodeJS.Timeout | null = null;
    #options: X2jOptionsOptional = {};
    #parser: XMLParser;

    public readonly results = new Set<T>();
    public timeout = 60 * 1000 * 60;
    public save = 10;
    public url = 'https://google.com/';

    public afterSave = noop;

    /**
     * @param loadFunction function to run after RSS feed has been fetched and parsed.
     * @param options RSS reader options
     */
    constructor(loadFunction = noop, options: X2jOptionsOptional = {}) {
        this.afterSave = loadFunction;
        this.#parser = new XMLParser(options);
        this.#options = options;
    }

    /**
     * Very rarely, a network/server side error will occur. This function retries requests
     * up to 10 times before giving up.
     */
    forceFetch = async () => {
        for (let i = 0; i < 10; i++) {
            try {
                const ac = new AbortController();
                setTimeout(ac.abort.bind(ac), 15000).unref();

                const res = await fetch(this.url, {
                    signal: ac.signal,
                    headers: { 
                        'User-Agent': `Khafra-Bot (https://github.com/khafradev/Khafra-Bot, v${config.version})` 
                    }
                });

                return res;
            } catch (e) {
                if (!(e instanceof Error))
                    return;
                else if (e.name === 'AbortError')
                    break;

                await delay(1000);
            }
        }
    }

    parse = async () => {
        const r = await this.forceFetch();
        const xml = await r?.text();

        const validXML = xml ? XMLValidator.validate(xml) : false;
        if (typeof xml !== 'string' || validXML !== true) {
            if (validXML !== true && validXML !== false) {
                const { line, msg, code } = validXML.err;
                console.log(`${code}: Error on line ${line} "${msg}". ${this.url}`);
            }
            console.log(`${this.url} has been disabled as invalid XML has been fetched.`);
            return clearInterval(this.#interval!);
        } else if (r && r.redirected) {
            console.log(`${this.url} redirected you to ${r.url} (redirected=${r.redirected})`);
        }

        // if the XML is valid, we can clear the old cache
        this.results.clear();
        const j = this.#parser.parse(xml, this.#options) as RSSJSON<T> | AtomJSON<T>;

        if (!('rss' in j) && !('feed' in j)) {
            return clearInterval(this.#interval!);
        }

        // respects a feed's ttl or syndication frequency option if present.
        // https://www.rssboard.org/rss-draft-1#element-channel-ttl
        // https://web.resource.org/rss/1.0/modules/syndication/
        if ('rss' in j) {
            if (typeof j.rss.channel?.ttl === 'number') {
                clearInterval(this.#interval!);
                this.timeout = 60 * 1000 * j.rss.channel.ttl;
                if (this.timeout <= 0) this.timeout = 60 * 1000 * 60;

                this.#interval = setInterval(
                    () => void this.parse(), 
                    this.timeout
                ).unref();
            } else if (
                typeof j.rss.channel?.['sy:updateFrequency'] === 'string' && 
                typeof j.rss.channel?.['sy:updatePeriod'] === 'number'
            ) {
                const period = j.rss.channel['sy:updatePeriod'];
                const frequency = j.rss.channel['sy:updateFrequency'];

                // make sure that the period and frequency are both valid
                if (!validateNumber(period) || !syUpdateFrequency.includes(frequency)) {
                    return clearInterval(this.#interval!);
                }

                const time = Math.floor(period * ms[frequency]);
                if (!validateNumber(time)) {
                    return clearInterval(this.#interval!);
                } 

                this.#interval = setInterval(
                    () => void this.parse(),
                    time
                ).unref();
            }
        }

        const i = 'rss' in j 
            ? j.rss.channel?.item // RSS feed
            : j.feed.entry;      // Atom feed

        if (Array.isArray(i)) {
            for (const item of i.slice(0, this.save)) {
                this.results.add(item);
            }
        } else if (i !== null && i !== undefined) {
            this.results.add(i);
        }

        void this.afterSave?.();
    }

    cache = async (url: string) => {
        if (this.#interval) return this.#interval;
        this.url = url;

        await this.parse();
        this.#interval = setInterval(
            () => void this.parse(),
            this.timeout
        ).unref();
    }
}
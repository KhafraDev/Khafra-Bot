import fetch from 'node-fetch';
import { readFileSync, existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

interface IAPOD {
    copyright?: string | undefined
    date: string
    explanation: string
    hdurl: string
    media_type: string
    service_version: string
    title: string
    url: string
}

interface IAPODErr {
    code: number
    msg: string
}

const APOD_API_URL = 'https://api.nasa.gov/planetary/apod?api_key=';

class NASAError extends Error {
    constructor(m?: string) {
        super(m);
        this.name = new.target.name;
    }
}

const EPOCH = new Date(1995, 5, 16);
const APOD_PATH = join(process.cwd(), 'assets/NASA.json');

// 1,000 requests an hour
// (limits expire an hour after each request is sent)
let ratelimit = 1000;
let interval: NodeJS.Timeout | null = null;
let lastDate: Date | null = (() => {
    if(existsSync(APOD_PATH)) {
        const file = JSON.parse(readFileSync(APOD_PATH, 'utf-8'));
        const [y, m, d] = Object.keys(file).pop().split('-');
        return new Date(+y, +m - 1, +d);
    }
    return null;
})();

export const cache = new Map<string, Pick<
    IAPOD, 
    'date' | 'copyright' | 'hdurl' | 'title'>
>();

export const APOD = async (bulk?: boolean) => {
    if(!process.env.NASA) return Promise.reject(new NASAError('No NASA API key in env!'));

    const sd = setLastDate();
    if(!sd) return Promise.reject(new NASAError('Exceeded APOD EPOCH.'));
    
    const date = bulk ? `&date=${sd}` : '';
    const res = await fetch(`${APOD_API_URL}${process.env.NASA}${date}`);
    ratelimit = parseInt(res.headers.get('X-RateLimit-Remaining'));

    if(res.status === 429) return Promise.reject(new NASAError('Rate-limit reached!'));

    const json = await res.json() as IAPOD | IAPODErr;
    if('code' in json) return Promise.reject(new NASAError(json.msg));
    return json;
}

export const APOD_BULK_FETCH = async (): Promise<void> => {
    const errors: Error[] = [];
    while(ratelimit !== 0) {
        try {
            const photo = await APOD(true);
            cache.set(photo.date, (() => {
                (['explanation', 'media_type', 'service_version', 'url'] as const).forEach(k => delete photo[k]);
                return photo;
            })());
        } catch(e) {
            errors.push(e as Error);
            if(errors.length > 10) {
                return Promise.reject(
                    new NASAError(errors.map(e => e.toString()).join('\n'))
                );
            }
        }
    }

    if(!interval) {
        interval = setInterval(() => {
            clearInterval(interval);
            ratelimit = 1000;
        }, 60 * 1000 * 60);
    }
}

export const APOD_SAVE = async () => {
    const data = Object.fromEntries(cache);
    cache.clear();

    if(existsSync(APOD_PATH)) {
        const file = JSON.parse(readFileSync(APOD_PATH, 'utf-8'));
        await writeFile(APOD_PATH, JSON.stringify(Object.assign(file, data), null, 2));
    } else {
        await writeFile(APOD_PATH, JSON.stringify(data, null, 2));
    }
}

export const APOD_CLEAR_BAD = async () => {
    if(!existsSync(APOD_PATH)) return;

    const file = JSON.parse(await readFile(APOD_PATH, 'utf-8'));
    for(const key of Object.keys(file)) {
        const obj = file[key];
        if(!('hdurl' in obj)) {
            delete file[key];
        }
        delete obj['date'];
    }

    await writeFile(APOD_PATH, JSON.stringify(file, null, 2));
}

const setLastDate = (): string | null => {
    lastDate = !lastDate 
        ? lastDate = new Date() 
        : lastDate = new Date(lastDate.getTime() - 86_400_000);

    if(lastDate.getTime() <= EPOCH.getTime()) return null;

    return `${lastDate.getFullYear()}-${(lastDate.getMonth()+1+'').padStart(2, '0')}-${(lastDate.getDate()+'').padStart(2, '0')}`;
}
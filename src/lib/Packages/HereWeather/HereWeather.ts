import { fetch, Response } from 'undici';
import { HereResult } from './types/HereWeather';

const consumeBody = async (res: Response) => {
    if (res.body === null) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _chunk of res.body) {}
}

export const weather = async (q: string) => {
    q = encodeURIComponent(q);

    const res = await fetch(`https://weather.ls.hereapi.com/weather/1.0/report.json?apiKey=${process.env.HERE_WEATHER}&product=observation&name=${q}`);

    // https://developer.here.com/documentation/destination-weather/dev_guide/topics/http-status-codes.html
    if (res.status === 200) {
        return res.json() as Promise<HereResult>;
    } else {
        void consumeBody(res);
        return res;
    }
}
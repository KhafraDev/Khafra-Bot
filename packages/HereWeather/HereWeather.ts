import { env } from 'node:process';
import { URLSearchParams } from 'node:url';
import { request } from 'undici';
import type { HereResult } from './types/HereWeather';

export const weather = async (q: string): Promise<HereResult | null> => {
    const params = new URLSearchParams({
        apiKey: env.HERE_WEATHER!,
        product: 'observation',
        name: q
    });

    const {
        body,
        statusCode
    } = await request(`https://weather.ls.hereapi.com/weather/1.0/report.json?${params}`);

    // https://developer.here.com/documentation/destination-weather/dev_guide/topics/http-status-codes.html
    if (statusCode === 200) {
        return body.json() as Promise<HereResult>;
    } else {
        return null;
    }
}
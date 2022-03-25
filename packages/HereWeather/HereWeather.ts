import { request, type Dispatcher } from 'undici';
import { env } from 'process';
import { HereResult } from './types/HereWeather';

const consumeBody = async (res: Dispatcher.ResponseData['body']): Promise<void> => {
    for await (const _chunk of res) {}
}

export const weather = async (q: string): Promise<HereResult | null> => {
    q = encodeURIComponent(q);

    // TODO: use URLSearchParams
    const {
        body,
        statusCode
    } = await request(`https://weather.ls.hereapi.com/weather/1.0/report.json?apiKey=${env.HERE_WEATHER}&product=observation&name=${q}`);

    // https://developer.here.com/documentation/destination-weather/dev_guide/topics/http-status-codes.html
    if (statusCode === 200) {
        return body.json() as Promise<HereResult>;
    } else {
        void consumeBody(body);
        return null;
    }
}
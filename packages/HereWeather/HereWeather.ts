import { env } from 'process';
import { request, type Dispatcher } from 'undici';
import { URLSearchParams } from 'url';
import { HereResult } from './types/HereWeather';

const consumeBody = async (res: Dispatcher.ResponseData['body']): Promise<void> => {
    for await (const _chunk of res) {}
}

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
        void consumeBody(body);
        return null;
    }
}
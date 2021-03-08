import fetch from 'node-fetch';
import { HereResult } from './types/Here';

export const weather = async (q: string) => {
    q = encodeURIComponent(q);

    const res = await fetch(`https://weather.ls.hereapi.com/weather/1.0/report.json?apiKey=${process.env.HERE_WEATHER}&product=observation&name=${q}`);

    // https://developer.here.com/documentation/destination-weather/dev_guide/topics/http-status-codes.html
    if (res.status === 200) {
        return res.json() as Promise<HereResult>;
    } else {
        return res;
    }
}
import { HereResult } from './types/HereWeather';
export declare const weather: (q: string) => Promise<HereResult | null>;

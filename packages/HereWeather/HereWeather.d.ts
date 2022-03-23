import { type Response } from 'undici';
import { HereResult } from './types/HereWeather';
export declare const weather: (q: string) => Promise<Response | HereResult>;

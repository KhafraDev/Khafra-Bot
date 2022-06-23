import { request } from 'undici';
import type { WttrInResult } from '../types';

export const wttrin = async (query: string): Promise<WttrInResult> => {
    const { body } = await request(
        `https://wttr.in/${encodeURIComponent(query)}?0&format=j1`
    );

    return body.json() as Promise<WttrInResult>;
}
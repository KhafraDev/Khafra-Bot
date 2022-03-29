import { request } from 'undici';
import { json } from 'stream/consumers';
import { setTimeout, clearTimeout } from 'timers';

interface Batch {
    batch: number[]
    wavNames: string[]
    scores: number[]
    torchmoji: (string | number)[]
    text_parsed: string[]
    tokenized: string[]
    dict_exists: string[][]
}

export class FifteenDotAI {
    static async getWav(
        character: string,
        content: string,
        emotion: string
    ): Promise<Batch | null> {
        const ac = new AbortController();
        const timeout = setTimeout(() => ac.abort(), 60_000);

        const {
            body,
            statusCode
        } = await request('https://api.15.ai/app/getAudioFile5', {
            method: 'POST',
            headers: {
                'User-Agent': 'Khafra-Bot (https://github.com/KhafraDev/Khafra-Bot, v1.10)',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.5',
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify({
                character,
                text: content,
                emotion
            }),
            headersTimeout: 1000 * 60 * 2,
            signal: ac.signal
        });

        clearTimeout(timeout);

        if (statusCode === 200) {
            return await json(body) as Batch;
        }

        return null;
    }
}
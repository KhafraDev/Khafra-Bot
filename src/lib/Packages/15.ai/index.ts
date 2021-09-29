import { request } from 'undici';
import { json } from 'stream/consumers';

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
        text: string,
        emotion: string
    ) {
        const {
            body,
            statusCode
        } = await request('https://api.15.ai/app/getAudioFile4', {
            method: 'POST',
            headers: {
                'User-Agent': 'Khafra-Bot (https://github.com/KhafraDev/Khafra-Bot, v1.10)',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.5',
                'Content-Type': 'application/json;charset=utf-8',
            },
            body: JSON.stringify({
                character,
                text,
                emotion
            }),
            headersTimeout: 1000 * 60 * 2
        });
        
        if (statusCode === 200) {
            return await json(body) as Batch;
        }

        return null;
    }
}
import fetch from 'undici-fetch';
import { deepStrictEqual } from 'assert';

interface NonexistentWord {
    word: {
        word: string
        definition: string
        /** Part of speech */
        pos: string
        topic: null | string
        example?: string | undefined
        syllables: string[]
        probably_exists: boolean
        dataset_type: null | string
    }
    permalink_url: string
}

export const thisWordDoesNotExist = async (): Promise<NonexistentWord> => {
    try {
        const res = await fetch('https://www.thisworddoesnotexist.com/api/random_word.json');
        deepStrictEqual(res.status, 200);
        const json = await res.json() as Promise<NonexistentWord>;
        if (!('word' in json) || !('permalink_url' in json)) {
            return Promise.reject();
        }
        return json;
    } catch(e) {
        return Promise.reject(e);
    }
}
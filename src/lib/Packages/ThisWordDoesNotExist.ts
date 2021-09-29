import { fetch } from 'undici';
import { consumeBody } from '../Utility/FetchUtils.js';

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

export const thisWordDoesNotExist = async () => {
    const res = await fetch('https://www.thisworddoesnotexist.com/api/random_word.json');
    
    if (!res.ok) {
        void consumeBody(res);

        return null;
    }

    const json = await res.json() as NonexistentWord;

    if (!('word' in json) || !('permalink_url' in json)) {
        return null;
    }

    return json;
}
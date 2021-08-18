import fetch from 'undici-fetch';

interface IOwlBotWord {
    definitions: {
        type: string,
        definition: string,
        example: string | null,
        image_url: string | null,
        emoji: string | null
    }[],
    word: string,
    pronunciation: string | null
}

const url = 'https://owlbot.info/api/v4/dictionary/';
class OwlBotError extends Error {
    constructor(m?: string) {
        super(m);
        this.name = 'OwlBotError';
    }
}

export const owlbotio = async (word: string) => {
    word = encodeURIComponent(word.toLowerCase());
    if (!process.env.OWLBOTIO) {
        return Promise.reject(new OwlBotError('No API token found in env variables.'));
    }

    const res = await fetch(`${url}${word}`, {
        headers: {
            Authorization: `Token ${process.env.OWLBOTIO}`
        }
    });
    const json = await res.json() as IOwlBotWord;

    return json;
}
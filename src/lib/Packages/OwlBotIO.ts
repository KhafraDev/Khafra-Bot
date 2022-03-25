import { request } from 'undici';
import { env } from 'process';

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

export const owlbotio = async (word: string): Promise<IOwlBotWord | null> => {
    word = encodeURIComponent(word.toLowerCase());
    if (!env.OWLBOTIO) {
        return null;
    }

    const { body } = await request(`${url}${word}`, {
        headers: {
            Authorization: `Token ${env.OWLBOTIO}`
        }
    });

    return body.json() as Promise<IOwlBotWord>;
}
import { fetch } from 'undici';
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

    const res = await fetch(`${url}${word}`, {
        headers: {
            Authorization: `Token ${env.OWLBOTIO}`
        }
    });
    const json = await res.json() as IOwlBotWord;

    return json;
}
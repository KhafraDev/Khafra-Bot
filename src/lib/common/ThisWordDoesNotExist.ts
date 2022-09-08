import { request } from 'undici'

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

export const thisWordDoesNotExist = async (): Promise<NonexistentWord | null> => {
    const { body, statusCode } = await request('https://www.thisworddoesnotexist.com/api/random_word.json')

    if (statusCode !== 200) {
        return null
    }

    const json = await body.json() as NonexistentWord

    if (!('word' in json) || !('permalink_url' in json)) {
        return null
    }

    return json
}
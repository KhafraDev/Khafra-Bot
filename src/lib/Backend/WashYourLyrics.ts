import fetch from 'node-fetch';

export const washYourLyrics = async (
    title: string, artist: string
): Promise<NodeJS.ReadableStream> => {
    const res = await fetch('https://washyourlyrics.com/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
            type: 'soap',
            contentType: 'song',
            skinTone: 3,
            song: { title, artist }
        })
    });

    if(!res.ok) {
        return Promise.reject(await res.json());
    }

    return res.body;
}
import fetch from 'node-fetch';
import { promisify } from 'util';
import zlib from 'zlib';
import { deepStrictEqual } from 'assert';

const unzip = promisify(zlib.unzip);

export const parseQuran = async () => {
    const res = await fetch('https://sacred-texts.com/isl/pick/pick.txt.gz');
    const buffer = await res.buffer();

    let unzipped;
    try {
        unzipped = await unzip(buffer);
    } catch(e) {
        return Promise.reject(e);
    }

    const sections = unzipped.toString()
        .split(`The Meaning of the Glorious Qur'an, by M.M. Pickthall, at sacred-texts.com`)
        .map(l => l.trim())
        .filter(l => l.length > 0);

    deepStrictEqual(sections.length, 114);

    const split = sections.map(s => {
        const [title, ...verses] = s.split('\r\n\r\n');
        const verse = verses.map(v => {
            const [, book, verse, content] = v.match(/^\[(\d+)_(\d+)\]\d+ (.*)/) as string[];
            return { book: +book, verse: +verse, content };
        });
        return { title, verses: verse }
    });

    return split;
}
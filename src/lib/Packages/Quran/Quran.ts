import { fetch } from 'undici';
import { promisify } from 'util';
import { createHash } from 'crypto';
import { unzip } from 'zlib';

interface Title {
    chapter: string
    title: string
}

interface Excerpt {
    book: string
    verse: string
    content: string
}

const unzipAsync = promisify(unzip);
const titleReg = /^(?<chapter>\d{1,3})\. (?<title>.*?)$/gm;
const verseReg = /^\[(?<book>\d{3})_(?<verse>\d{3})\]\d{1,3} (?<content>.*?)$/gm
// sha-256 of file buffer
const hash = 'e6a7cdaa513dbe10f37aa49ac2c2cad726b35031a227ebb03c839dd3daf1dabb'; 

export const parseQuran = async (): Promise<{ verses: Excerpt[], titles: Title[] }> => {
    const res = await fetch('https://sacred-texts.com/isl/pick/pick.txt.gz');
    const buffer = await res.arrayBuffer();

    const sha256 = createHash('sha256').update(buffer).digest('hex');
    if (sha256 !== hash)
        throw new Error(`File hash: ${sha256}, expected ${hash}.`);

    const unzipped = await unzipAsync(buffer);
    const book = unzipped.toString();
    const verses = [...book.matchAll(verseReg)].map(f => f.groups) as unknown as Excerpt[];
    const titles = [...book.matchAll(titleReg)].map(f => f.groups) as unknown as Title[];

    return { verses, titles };
}
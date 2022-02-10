import { sql } from '#khaf/database/Postgres.js';
import { ZipFile } from '#khaf/utility/Unzip.js';
import { Buffer } from 'buffer';
import { fetch } from 'undici';

interface IBibleVerse {
    idx: number
    book: string
    chapter: number
    verse: number
    content: string
}

export const titles = {
    'Genesis': 'gen',
    'Exodus': 'exo',
    'Leviticus': 'lev',
    'Numbers': 'num',
    'Deuteronomy': 'deu',
    'Joshua': 'jos',
    'Judges': 'jdg',
    'Ruth': 'rut',
    '1 Samuel': 'sa1',
    '2 Samuel': 'sa2',
    '1 Kings': 'kg1',
    '2 Kings': 'kg2',
    '1 Chronicles': 'ch1',
    '2 Chronicles': 'ch2',
    'Ezra': 'ezr',
    'Nehemiah': 'neh',
    'Esther': 'est',
    'Job': 'job',
    'Psalms': 'psa',
    'Proverbs': 'pro',
    'Ecclesiastes': 'ecc',
    'Song of Solomon': 'sol',
    'Isaiah': 'isa',
    'Jeremiah': 'jer',
    'Lamentations': 'lam',
    'Ezekiel': 'eze',
    'Daniel': 'dan',
    'Hosea': 'hos',
    'Joel': 'joe',
    'Amos': 'amo',
    'Obadiah': 'oba',
    'Jonah': 'jon',
    'Micah': 'mic',
    'Nahum': 'nah',
    'Habakkuk': 'hab',
    'Zephaniah': 'zep',
    'Haggai': 'hag',
    'Zechariah': 'zac',
    'Malachi': 'mal',
    '1 Esdras': 'es1',
    '2 Esdras': 'es2',
    'Tobias': 'tob',
    'Judith': 'jdt',
    'Additions to Esther': 'aes',
    'Wisdom': 'wis',
    'Baruch': 'bar',
    'Epistle of Jeremiah': 'epj',
    'Susanna': 'sus',
    'Bel and the Dragon': 'bel',
    'Prayer of Manasseh': 'man',
    '1 Macabees': 'ma1',
    '2 Macabees': 'ma2',
    '3 Macabees': 'ma3',
    '4 Macabees': 'ma4',
    'Sirach': 'sir',
    'Prayer of Azariah': 'aza',
    'Laodiceans': 'lao',
    'Joshua B': 'jsb',
    'Joshua A': 'jsa',
    'Judges B': 'jdb',
    'Judges A': 'jda',
    'Tobit BA': 'toa',
    'Tobit S': 'tos',
    'Psalms of Solomon': 'pss',
    'Bel and the Dragon Th': 'bet',
    'Daniel Th': 'dat',
    'Susanna Th': 'sut',
    'Odes': 'ode',
    'Matthew': 'mat',
    'Mark': 'mar',
    'Luke': 'luk',
    'John': 'joh',
    'Acts': 'act',
    'Romans': 'rom',
    '1 Corinthians': 'co1',
    '2 Corinthians': 'co2',
    'Galatians': 'gal',
    'Ephesians': 'eph',
    'Philippians': 'phi',
    'Colossians': 'col',
    '1 Thessalonians': 'th1',
    '2 Thessalonians': 'th2',
    '1 Timothy': 'ti1',
    '2 Timothy': 'ti2',
    'Titus': 'tit',
    'Philemon': 'plm',
    'Hebrews': 'heb',
    'James': 'jam',
    '1 Peter': 'pe1',
    '2 Peter': 'pe2',
    '1 John': 'jo1',
    '2 John': 'jo2',
    '3 John': 'jo3',
    'Jude': 'jde',
    'Revelation': 'rev'
};

export const titleRegex = new RegExp(Object.keys(titles).join('|'), 'i');

export const parseBible = async (): Promise<Omit<IBibleVerse, 'idx'>[]> => {
    const res = await fetch('https://www.sacred-texts.com/bib/osrc/kjvdat.zip');
    const buffer = await res.arrayBuffer();
    
    const zip = ZipFile(Buffer.from(buffer));
    const bible = zip.shift()!.getData().toString('utf-8');

    const lines: Omit<IBibleVerse, 'idx'>[] = bible
        .split(/~/g) // each line ends with ~ to denote the end of a verse
        .filter(l => l.trim().length > 0) // for example the last line is a newline, causing an undefined/NaN combo below
        .map(line => {
            const [book, chapter, verse, content = ''] = line.split('|');
            return {
                book: book.trim(), 
                chapter: +chapter, 
                verse: +verse, 
                content: content.trim()
            };
        });

    return lines;
}

let ran = false;

export const bibleInsertDB = async (): Promise<boolean> => {
    if (ran) return true;

    const rows = await sql<{ exists: boolean }[]>`SELECT EXISTS(SELECT 1 FROM kbBible);`;

    if (rows[0].exists === true) {
        ran = true;
        return true;
    }

    const bible = await parseBible();

    await sql.begin<IBibleVerse[]>(async sql => {
        const docs: IBibleVerse[] = [];

        for (const { book, chapter, verse, content } of bible) {
            const doc = await sql<IBibleVerse[]>`
                INSERT INTO kbBible (
                    book, chapter, verse, content
                ) VALUES (
                    ${book}, ${chapter}, ${verse}, ${content}
                ) ON CONFLICT DO NOTHING;
            `;

            docs.push(...doc);
        }
      
        return docs;
    });

    ran = true;
    return true;
}
const consonants = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'];
const vowels = ['A', 'E', 'I', 'O', 'U'];

const consPattern = `^[${consonants.join('')}${consonants.join('').toLowerCase()}]`;
const vowePattern = `^[${vowels.join('')}${vowels.join('').toLowerCase()}]{1}`;

const reConsonants = new RegExp(`${consPattern}{2,}`);
const vowel = new RegExp(vowePattern);
const nonAlphanumeric = new RegExp(/[^A-z]/g);

/**
 * Translate a sentence into pig latin.
 * @param {string} s 
 */
export const pigLatin = (s: string) => {
    const words = s.split(/\s+/g).map(w => {
        const punc = w.match(nonAlphanumeric);

        if(vowel.test(w)) w = `${w}yay`;
        else if(reConsonants.test(w)) {
            const m = w.match(reConsonants);

            w = m?.[0] === w 
                ? `${w[w.length-1]}${w.slice(0, -1)}ay` // rhythm (entire word)
                : `${w.slice(m[0].length)}${m[0]}ay`;   // other words
        } else w = `${w.slice(1)}${w[0]}ay`;

        w = w.replace(nonAlphanumeric, '');
        w += punc?.join('') ?? '';
        return w;
    });

    return words
        .map(w => w.toLowerCase())
        .join(' ');
}
import { once } from '#khaf/utility/Memoize.js';
import { request } from 'undici';

type IEmoji = {
    codePoints: string
    identifier: string
    comment: string
    isSub: undefined
    group: undefined
} | {
    codePoints: undefined
    identifier: undefined
    comment: undefined
    isSub: string
    group: string
}

const unicodeRegex = /^((?<codePoints>.*?)\s+; (?<identifier>[a-z-]+)\s+# (?<comment>(.*?))|# (?<isSub>sub)?group: (?<group>(.*?)))$/gm;

export const parseEmojiList = once(async () => {
    const cache = new Map<string, { [key in keyof IEmoji]: string }>();
    const { body } = await request('https://unicode.org/Public/emoji/14.0/emoji-test.txt');
    const fullList = await body.text();

    const list = fullList.matchAll(unicodeRegex);

    let group = '', subgroup = '';

    for (const item of list) {
        const {
            group: newGroup,
            isSub,
            codePoints,
            identifier,
            comment
        } = item.groups as unknown as IEmoji;

        if (newGroup !== undefined) {
            if (isSub === 'sub') {
                subgroup = newGroup
            } else {
                group = newGroup;
            }

            continue;
        }

        cache.set(codePoints, { group, isSub: subgroup, codePoints, identifier, comment })
    }

    return cache;
});
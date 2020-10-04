/**
 * Trim a multi-line template literal to a single line.
 * @example
 * const a = `
 * Foo: ${1 + 2}
 * Bar: Hello!
 * Baz: ${2 - 20}
 * `;
 * assert.strictEqual(trim`${a}`, 'Foo: 3 Bar: Hello! Baz: -18');
 */
export const trim = (...s: [TemplateStringsArray, ...(string | number)[]]) => {
    let str = '';
    for(let i = 1; i < s.length; i++) {
        str += s[0][i-1] + (s[i] ?? '');
    }
    str += s[0].slice(s.length - 1).join('');
    return str.split(/\n\r|\n|\r/g).map(e => e.trim()).join(' ').trim();
}
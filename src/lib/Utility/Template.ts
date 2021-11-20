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
    for (let i = 1; i < s.length; i++) {
        str += s[0][i-1] + (s[i] ?? '');
    }
    str += s[0].slice(s.length - 1).join('');
    return str.split(/\r?\n/g).map(e => e.trim()).join(' ').trim();
}

/**
 * Strip leading indents from a multi-lined template literal.
 */
export const stripIndents = (temp: TemplateStringsArray, ...args: unknown[]) => {
    const s = temp.raw;
    let f = '';
    for (const item of s) {
        // rather than using \s+ for all whitespace, we use a normal space
        // this fixes a bug where two+ new lines will be transformed into 1
        const str = item
            .replace(/\n +/g, '\n')
            // then we remove backslashes not followed by a-z (\n, \t, etc. will not be matched)
            .replace(/\\(?![a-z])/g, '');

        f += `${str}${args.shift() ?? ''}`;
    }

    return f.trim();
}
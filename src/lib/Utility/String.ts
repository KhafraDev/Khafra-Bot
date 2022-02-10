export const upperCase = <T extends string>(s: T): string => 
    `${s.charAt(0).toUpperCase()}${s.slice(1).toLowerCase()}` as Capitalize<T>;

export const plural = (n: number, suffix = 's'): string => n === 1 ? '' : suffix;

export const ellipsis = (s: string, maxLength: number): string => s.length > maxLength
    ? `${s.slice(0, maxLength - 3)}...`
    : s;

/**
 * Split a given string (`s`) `n` times
 * @param s string to split
 * @param n size of each chunk
 * @returns {string[]}
 */
export const split = (s: string, n: number): string[] => {
    const chunks: string[] = [];

    for (let i = 0; i < s.length; i += n) {
        chunks.push(s.slice(i, i + n));
    }

    return chunks;
}
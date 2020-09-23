export function* chunk<T>(arr: T[], size: number) {
    for(let i = 0; i < arr.length; i += size) {
        yield arr.slice(i, i + size);
    }
}

export const shuffle = <T>(a: T[]): T[] => {
    for(let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
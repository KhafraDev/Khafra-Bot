/**
 * Array chunking without generator functions
 */
export const chunkSafe = <T>(arr: T[], step: number): T[][] => {
    const res: T[][] = []
    for (let i = 0; i < arr.length; i += step)
        res.push(arr.slice(i, i + step))

    return res
}

export const shuffle = <T>(a: T[]): T[] => {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]]
    }
    return a
}
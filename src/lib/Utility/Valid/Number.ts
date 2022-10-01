/**
 * Ensures a value is a number, an integer, and between min-max values.
 */
export const Range = ({ min = 0, max = 0, inclusive = false } = {}): (value: number) => boolean  => {
    min = inclusive ? min : min + 1
    max = inclusive ? max : max - 1

    return (value: number): boolean => {
        return (
            typeof value === 'number' &&
            Number.isInteger(value) &&
            value >= min &&
            value <= max
        )
    }
}
export const validateNumber = (num: unknown): num is number => {
    return (
        typeof num === 'number' &&
        Number.isInteger(num) &&
        num >= 1 &&
        num <= Number.MAX_SAFE_INTEGER
    );
}

/**
 * Ensures a value is a number, an integer, and between min-max values. 
 */
export const Range = ({ min = 0, max = 0, inclusive = false } = {}) => {
    min = inclusive ? min : min + 1;
    max = inclusive ? max : max - 1;

    return (value: number): boolean => {
        return (
            typeof value === 'number' &&
            Number.isInteger(value) &&
            value >= min &&
            value <= max
        );
    }
}
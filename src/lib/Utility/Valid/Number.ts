type Disallow =
    | 'infinity'
    | 'negative'
    | 'zero'
    | 'float'
    | 'unsafe'

const strictDefaultChecks: Disallow[] = [
    'infinity',
    'negative',
    'zero',
    'float',
    'unsafe'
];

/**
 * Make sure user input is a valid number.
 * By default, disallows `infinity`/`negatives`/`zero`/`floats`/`unsafe integers`.
 * @param num Number to check
 * @param disallow array of checks, defaults to all
 */
export const validateNumber = (num: number, disallow: Disallow[] = strictDefaultChecks) => {
    return !(
        (disallow.includes('infinity') && !Number.isFinite(num)) || // +/- infinity disallowed
        (disallow.includes('negative') && num < 0) || // negative numbers disallowed
        (disallow.includes('zero') && num === 0) || // zero disallowed
        (disallow.includes('float') && !Number.isInteger(num)) || // floats disallowed
        (disallow.includes('unsafe') && !Number.isSafeInteger(num)) // unsafe integers
    );
}
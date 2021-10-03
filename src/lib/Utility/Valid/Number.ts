type Disallow =
    | 'infinity'
    | 'negative'
    | 'zero'
    | 'float'
    | 'unsafe'
    | 'nan'

const strictDefaultChecks: Disallow[] = [
    'infinity',
    'negative',
    'zero',
    'float',
    'unsafe',
    'nan'
];

/**
 * Make sure user input is a valid number.
 * By default, disallows `infinity`/`negatives`/`zero`/`floats`/`unsafe integers`.
 * @param num Number to check
 * @param disallow array of checks, defaults to all
 */
export const validateNumber = (num: unknown, disallow: Disallow[] = strictDefaultChecks): num is number => {
    return typeof num === 'number' && !(
        (disallow.includes('nan') && Number.isNaN(num)) || // disallow NaN
        (disallow.includes('infinity') && !Number.isFinite(num)) || // +/- infinity disallowed
        (disallow.includes('negative') && num < 0) || // negative numbers disallowed
        (disallow.includes('zero') && num === 0) || // zero disallowed
        (disallow.includes('float') && !Number.isInteger(num)) || // floats disallowed
        (disallow.includes('unsafe') && !Number.isSafeInteger(num)) // unsafe integers
    );
}
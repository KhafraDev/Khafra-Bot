// TODO(@KhafraDev): remove this once old warning commands are removed.

export const isValidNumber = (num: number, { 
    allowInfinity = false, 
    allowNegative = false,
    allowFloats   = false,
    allowUnsafe   = false,
    allowNaN      = false
} = {}) => {
    if (!allowInfinity && !Number.isFinite(num)) {
        return false;
    } else if (!allowNegative && num < 0) {
        return false;
    } else if (!allowInfinity && !allowFloats && !Number.isInteger(num)) {
        return false;
    } else if (!allowInfinity && !allowUnsafe && !Number.isSafeInteger(num)) {
        return false;
    } else if (!allowNaN && Number.isNaN(num)) {
        return false;
    }

    return true;
}

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
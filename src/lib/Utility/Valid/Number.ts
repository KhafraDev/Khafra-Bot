export const isValidNumber = (num: number, { 
    allowInfinity = false, 
    allowNegative = false,
    allowFloats   = false,
    allowUnsafe   = false,
    allowNaN      = false
} = {}) => {
    if(!allowInfinity && !Number.isFinite(num)) {
        return false;
    } else if(!allowNegative && num < 0) {
        return false;
    } else if(!allowInfinity && !allowFloats && !Number.isInteger(num)) {
        return false;
    } else if(!allowInfinity && !allowUnsafe && !Number.isSafeInteger(num)) {
        return false;
    } else if(!allowNaN && Number.isNaN(num)) {
        return false;
    }

    return true;
}
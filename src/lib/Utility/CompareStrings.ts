/**
 * Compare similarity between 2 strings using Dice's coefficient. 
 * Case sensitive - ``abc`` isn't ``AbC`` in my opinion.
 * @see https://en.wikipedia.org/wiki/S%C3%B8rensen%E2%80%93Dice_coefficient
 * @author Khafra
 * @param X first string
 * @param Y second string
 * @returns {number} "quotient of similarity" (number 0-1).
 */
export const compareTwoStrings = (X: string, Y: string): number => {
    const bigramsX = Array.from(
        { length: X.length - 1 },
        (_, index) => X[index] + X[index + 1]
    );

    const bigramsY = Array.from(
        { length: Y.length - 1 },
        (_, index) => Y[index] + Y[index + 1]
    );

    const inBoth = bigramsX.filter(current => bigramsY.indexOf(current) > -1);
    return (2 * inBoth.length) / (bigramsX.length + bigramsY.length);
}
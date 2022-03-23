/**
 * Compare similarity between 2 strings using Dice's coefficient.
 * Case sensitive - ``abc`` isn't ``AbC`` in my opinion.
 * @see https://en.wikipedia.org/wiki/S%C3%B8rensen%E2%80%93Dice_coefficient
 * @author Khafra
 * @param {string} X first string
 * @param {string} Y second string
 * @returns {number} "quotient of similarity" (number 0-1).
 */
export const compareTwoStrings = (X: string, Y: string): number => {
    let bigramsX = 0, bigramsY = 0, inBoth = 0;
    for (let i = 0; i < X.length - 1; i++) bigramsX++;
    for (let i = 0; i < Y.length - 1; i++) {
        bigramsY++;
        if (X.includes(Y[i] + Y[i + 1])) inBoth++;
    }

    return (2 * inBoth) / (bigramsX + bigramsY);
}

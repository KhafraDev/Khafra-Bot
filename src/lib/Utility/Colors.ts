const color = (front: number, back: number):
    (s: unknown) => string =>
    (s: unknown): string => `\x1b[${front}m${s}\x1b[${back}m`

export const bright = color(1, 22)
export const dim = color(2, 22)
export const underscore = color(4, 23)
export const blink = color(5, 24)
export const reverse = color(7, 27)
export const hidden = color(8, 28)

// foreground
export const black = color(30, 39)
export const red = color(31, 39)
export const green = color(32, 39)
export const yellow = color(33, 39)
export const blue = color(34, 39)
export const magenta = color(35, 39)
export const cyan = color(36, 39)
export const white = color(37, 39)

// background
export const bgBlack = color(40, 49)
export const bgRed = color(41, 49)
export const bgGreen = color(42, 49)
export const bgYellow = color(43, 49)
export const bgBlue = color(44, 49)
export const bgMagenta = color(45, 49)
export const bgCyan = color(46, 49)
export const bgWhite = color(47, 49)

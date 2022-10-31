export const time = (unix: Date, format: string): string =>
  `<t:${Math.floor(unix.getTime() / 1000)}:${format}>`

/**
 * Array chunking without generator functions
 */
export const chunkSafe = <T>(arr: T[], step: number): T[][] => {
  const res: T[][] = []
  for (let i = 0; i < arr.length; i += step)
    res.push(arr.slice(i, i + step))

  return res
}

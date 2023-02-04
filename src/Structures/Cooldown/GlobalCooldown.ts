import { minutes } from '#khaf/utility/ms.js'
import { setInterval } from 'node:timers'

/**
 * Create and use a cooldown everywhere in 2 steps.
 * @example
 * const cd = cooldown(1, 60000); // 1 command every 60 seconds
 * cd('myuniqueid'); // true -> not limited
 * cd('myuniqueid'); // false -> limited
 * @returns ``true`` if not limited, ``false`` if limited
 * @param max Max uses allows in ``ms`` milliseconds
 * @param ms How long cooldown applies for
 */
export const cooldown = (max: number, ms: number): (id: string) => boolean => {
  const m = new Map<string, number[]>()
  setInterval(() => { // clear out old entries
    for (const [k, v] of m) {
      const now = Date.now()
      const f = v.filter(d => now - d < ms)
      if (f.length === 0) {
        m.delete(k)
      } else {
        m.set(k, f)
      }
    }
  }, minutes(10)).unref()

  return (id: string): boolean => {
    const now = Date.now()
    if (!m.has(id)) {
      m.set(id, [now])
      return true
    } else {
      const i = m.get(id)!.filter(d => now - d < ms)
      if (i.length >= max) {
        return false
      } else {
        m.set(id, [...i, now])
        return true
      }
    }
  }
}

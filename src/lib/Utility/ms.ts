const durationRE = /(-?(?:\d+\.?\d*|\d*\.?\d+)(?:e[-+]?\d+)?)\s*([\p{L}]*)/uig

const conversions: Record<string, number> = {}

conversions.millisecond = conversions.milliseconds = conversions.ms = conversions[''] = 1
conversions.second = conversions.seconds = conversions.sec = conversions.s = conversions.ms * 1_000
conversions.minute = conversions.minutes = conversions.min = conversions.mins = conversions.m = conversions.s * 60
conversions.hour = conversions.hours = conversions.hr = conversions.h = conversions.m * 60
conversions.day = conversions.days = conversions.d = conversions.h * 24
conversions.week = conversions.weeks = conversions.wk = conversions.w = conversions.d * 7
conversions.month = conversions.months = conversions.d * (365.25 / 12)
conversions.year = conversions.years = conversions.yr = conversions.y = conversions.d * 365.25

const monthsUnion = 'January|February|March|April|May|June|July|August|September|October|November|December'
const dateRegex = new RegExp(`^(?<m>${monthsUnion})\\s+(?<d>\\d{1,2})(st|th)?,?(\\s+(?<y>\\d{4})?)?$`)

/**
 * parse human readable string to ms
 *
 * initial implementation: https://github.com/jkroso/parse-duration/
 * @license https://raw.githubusercontent.com/jkroso/parse-duration/7520a9855cdce7ec9219e8153059b566c1c8a426/License MIT
 */
export const parseStrToMs = (str: string): number => {
  const match = dateRegex.exec(str)

  if (match) {
    const { m, d, y } = match.groups!
    const year = Number(y || new Date().getFullYear())
    const date = new Date(`${m} ${d} ${year}`)

    if (!y) {
      if (date.getTime() - Date.now() < 0) {
        date.setFullYear(year + 1)
      }
    }

    return date.getTime() - Date.now()
  }

  const date = new Date(str)

  if (date.toString() !== 'Invalid Date') {
    return date.getTime() - Date.now()
  }

  let result = 0
  // remove commas/placeholders
  str = str.replace(/(\d)[,_](\d)/g, '$1$2').toLowerCase()
  str.replace(durationRE, (_, n: string, units: string) => {
    const unit = conversions[units]

    if (unit) {
      result += parseFloat(n) * unit
    }

    return ''
  })

  return result / Math.max(conversions.ms, 1)
}

export const seconds = (s: number): number => s * 1000
export const minutes = (m: number): number => seconds(m) * 60
export const hours = (h: number): number => minutes(h) * 60
export const days = (d: number): number => hours(d) * 24
export const weeks = (w: number): number => days(w) * 7

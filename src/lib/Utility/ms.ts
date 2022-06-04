const durationRE = /(-?(?:\d+\.?\d*|\d*\.?\d+)(?:e[-+]?\d+)?)\s*([\p{L}]*)/uig;

const conversions: Record<string, number> = {};

conversions.millisecond = conversions.ms = conversions[''] = 1;
conversions.second = conversions.sec = conversions.s = conversions.ms * 1_000;
conversions.minute = conversions.min = conversions.m = conversions.s * 60;
conversions.hour = conversions.hr = conversions.h = conversions.m * 60;
conversions.day = conversions.d = conversions.h * 24;
conversions.week = conversions.wk = conversions.w = conversions.d * 7;
conversions.month = conversions.b = conversions.d * (365.25 / 12);
conversions.year = conversions.yr = conversions.y = conversions.d * 365.25;

/**
 * parse human readable string to ms
 *
 * initial implementation: https://github.com/jkroso/parse-duration/
 * @license https://raw.githubusercontent.com/jkroso/parse-duration/7520a9855cdce7ec9219e8153059b566c1c8a426/License MIT
 *
 * changes: remove times less than a ms, remove some dead/extraneous/old code
 */
export const parseStrToMs = (str: string): number => {
  	let result = 0;
  	// remove commas/placeholders
  	str = str.replace(/(\d)[,_](\d)/g, '$1$2');
  	str.replace(durationRE, (_, n, units) => {
    	const unit = unitRatio(units);

    	if (unit) {
            result += parseFloat(n) * unit;
        }

        return ''; // so typescript is happy
  	});

    return result / Math.max(unitRatio(), 1);
}

const unitRatio = (str = 'ms'): number => {
    str = str.toLowerCase();
    return conversions[str] || conversions[str.replace(/s$/, '')];
}

export const seconds = (s: number): number => s * 1000;
export const minutes = (m: number): number => seconds(m) * 60;
export const hours = (h: number): number => minutes(h) * 60;
export const days = (d: number): number => hours(d) * 24;
export const weeks = (w: number): number => days(w) * 7;
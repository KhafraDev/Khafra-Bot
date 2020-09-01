const ordinal = (num = 0) => {
    if (num >= 10 && num <= 20) {
        return 'th';
    }

    switch(num % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

/**
 * Format dates with a human readable string. API is based off of moment but lacks some features that aren't needed for my uses.
 * @example
 * formatDate('MMMM Do, YYYY hh:mm:ssA', new Date('2020-04-15T09:35:07.785Z')); // April 15th, 2020 05:35:07am
 * @param format string to format date
 * @param date Date-like (string, number, or Date)
 * @param locale
 */
export const formatDate = (
    format = '', 
    date: Date | string | number, 
    locale = Intl.DateTimeFormat().resolvedOptions().locale
) => {
    const dateObj = new Date(date);

    const formatRegex = /(A|a|P|p)(m|M)?|MM?(MM?)?|D(D|o)?|YY(YY)?|dddd?|Q|HH?|hh?|kk?|mm?|ss?|t/g;
    const replace = format.replace(formatRegex, formatter => {
        switch(formatter) {
            case 'YYYY':    // 2020
                return '' + dateObj.getFullYear();
            case 'YY':      // 2010 -> 10
                return ('' + dateObj.getFullYear()).slice(-2);
            case 'Q':       // May -> Quarter 2, April -> Quarter 1
                return '' + Math.ceil((dateObj.getMonth() + 1) / 4);
            case 'M':       // 1
            case 'MM':      // 01 (month)
                return ('' + dateObj.getMonth() + 1).padStart(formatter.length, '0');
            case 'MMM':     // Aug
            case 'MMMM':    // August
                return Intl.DateTimeFormat(locale, { month: formatter === 'MMMM' ? 'long' : 'short' }).format(dateObj);
            case 'D':       // 1
            case 'DD':      // 01 (day of month)
                return ('' + dateObj.getDate()).padStart(formatter.length, '0')
            case 'Do':      // 1st
                return '' + dateObj.getDate() + ordinal(dateObj.getDate());
            case 'ddd':     // Mon
            case 'dddd':    // Monday
                return Intl.DateTimeFormat(locale, { weekday: formatter === 'dddd' ? 'long' : 'short' }).format(dateObj);
            case 'h':       // 0..12
            case 'hh':      // 00..12
            case 'H':       // 0..23
            case 'HH':      // 00..23
                return dateObj.toLocaleString(locale, { 
                    hour12: formatter[0] === 'H' ? false : true, 
                    hour: 'numeric' 
                }).split(' ').shift().padStart(formatter.length, '0');
            case 'A':
            case 'a':
            case 'p':
            case 'am':
            case 'pm':
            case 'AM':
            case 'PM':
                return dateObj.toLocaleString(locale, { 
                    hour12: true, 
                    hour: 'numeric' 
                }).split(' ').pop();
            case 'k':       // 1..24
            case 'kk':      // 01..24
                return ('' + dateObj.getHours()).padStart(formatter.length, '0');
            case 'm':       // 0..59
            case 'mm':      // 00.59
                return ('' + dateObj.getMinutes()).padStart(formatter.length, '0');
            case 's':       // 0..59
            case 'ss':      // 00.59
                return ('' + dateObj.getSeconds()).padStart(formatter.length, '0');
            case 't':
                const offset = new Date().getTimezoneOffset();
                const realOffset = offset / (offset > 0 ? -60 : 60);
                return 'GMT' + (realOffset > 0 ? '+' : '-') + Math.abs(realOffset);
            default:
                throw new Error('Unexpected identifier ' + formatter);
        }
    });

    return replace;
}
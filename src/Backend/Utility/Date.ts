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
 * formatDate('MMMM Do, YYYY kk:mm:ssA', new Date('2020-04-15T09:35:07.785Z')); // April 15th, 2020 06:35:07am
 * @param format string to format date
 * @param _date Date object
 * @param locale
 */
export const formatDate = (format = '', _date: Date | string, locale = Intl.DateTimeFormat().resolvedOptions().locale) => {
    const date = (_date instanceof Date ? _date : new Date(_date)) as Date;

    const formatRegex = /(A|a|P|p)(m|M)?|MM?(MM?)?|D(D|o)?|YY(YY)?|dddd?|Q|HH?|hh?|kk?|mm?|ss?|t/g;
    const replace = format.replace(formatRegex, formatter => {
        switch(formatter) {
            case 'YYYY':    // 2020
                return '' + date.getFullYear();
            case 'YY':      // 2010 -> 10
                return ('' + date.getFullYear()).slice(-2);
            case 'Q':       // May -> Quarter 2, April -> Quarter 1
            case 'M':       // 1
            case 'MM':      // 01 (month)
                const month = date.getMonth() + 1
                return formatter === 'Q' ? '' + Math.ceil(month / 4) :
                       formatter === 'M' ? '' + month : ('' + month).padStart(2, '0');
            case 'MMM':
            case 'MMMM':
                return Intl.DateTimeFormat(locale, { month: formatter === 'MMMM' ? 'long' : 'short' }).format(date);
            case 'D':       // 1
            case 'DD':      // 01 (day of month)
            case 'Do':      // 1st
                const day = date.getDate();
                return formatter === 'Do' ? '' + day + ordinal(day) :
                       formatter === 'D'  ? '' + day : ('' + day).padStart(2, '0');
            case 'ddd':     // Mon
            case 'dddd':    // Monday
                return Intl.DateTimeFormat(locale, { weekday: formatter === 'dddd' ? 'long' : 'short' }).format(date);
            case 'h':       // 0..12
            case 'hh':      // 00..12
                const hours = date.getHours();
                if(hours - 12 > 0) {
                    return formatter === 'h' ? '' + (hours - 12) : ('' + (hours - 12)).padStart(2, '0');
                }

                return formatter === 'h' ? '' + hours : ('' + hours).padStart(2, '0');
            case 'H':       // 0..23
            case 'HH':      // 00..23
            case 'A':
            case 'a':
            case 'p':
            case 'am':
            case 'pm':
            case 'AM':
            case 'PM':
                const hour23 = date.getHours();

                if(['a', 'p', 'am', 'pm'].includes(formatter.toLowerCase())) {
                    const isUppercase = formatter.toUpperCase() === formatter;
                    return (hour23 > 12) 
                        ? isUppercase ? 'PM' : 'pm' 
                        : isUppercase ? 'AM' : 'am';
                }
                
                return formatter === 'H' ? '' + hour23 : ('' + hour23).padStart(2, '0');
            case 'k':       // 1..24
            case 'kk':      // 01..24
                const hour24 = date.getHours();
                return formatter === 'k' ? '' + hour24 : ('' + hour24).padStart(2, '0');
            case 'm':       // 0..59
            case 'mm':      // 00.59
                return formatter === 'm' ? '' + date.getMinutes() : ('' + date.getMinutes()).padStart(2, '0');
            case 's':       // 0..59
            case 'ss':      // 00.59
                return formatter === 's' ? '' + date.getSeconds() : ('' + date.getSeconds()).padStart(2, '0');
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
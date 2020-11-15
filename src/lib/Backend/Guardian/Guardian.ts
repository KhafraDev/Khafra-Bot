import { URLSearchParams } from "url";
import { formatDate } from "../../Utility/Date.js";
import fetch from "node-fetch";
import { GuardianResponse } from "./types/Guardian";

/**
 * Similar to a `Number.isNaN` polyfill, since NaN !== NaN.
 */
const isValidDate = (d: Date) => {
    return d instanceof Date && d.getTime() === d.getTime();
}

export const guardian = async (q: string[], date: Date) => {
    if(!('THEGUARDIAN' in process.env)) {
        throw new Error('No Guardian API key!');
    }

    const search = new URLSearchParams();
    if(isValidDate(date)) {
        search.append('from-date', formatDate('YYYY-MM-DD', date));
    }
    // if a date is given, slice 1 item of the query array
    // otherwise, leave it be
    search.append('q', encodeURIComponent(search.has('from-date') ? q.slice(1).join(' ') : q.join(' ')));
    search.append('api-key', process.env.THEGUARDIAN);
    
    const res = await fetch('https://content.guardianapis.com/search?' + search.toString());
    return res.json() as Promise<GuardianResponse>;    
}
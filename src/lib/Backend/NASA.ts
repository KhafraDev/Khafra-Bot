import fetch from 'node-fetch';
import { URLSearchParams } from 'node:url';
import { nasaInsert } from '../Migration/NASA.js';

interface IAPOD {
    copyright?: string
    date: string
    explanation: string
    hdurl: string
    media_type: string
    service_version: string
    title: string
    url: string
}

const APOD_API_URL = 'https://api.nasa.gov/planetary/apod?';
const START = new Date(1995, 5 /* 0-indexed */, 16);

const formatDate = (d: Date) => 
    `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;

/**
 * Generate date ranges between June 16th, 1995 and the current date.
 * NASA's APOD api has issues when the start + end time differences are too large.
 * Even a yearly difference is extremely slow!
 */
const generateRanges = () => {
    const now = new Date();
    const dates = [];

    for (let i = START.getFullYear(); i <= now.getFullYear(); i++) {
        const start = formatDate(new Date(i, 0, 1));
        const end = formatDate(new Date(i, 11, 31));

        if (i === START.getFullYear())
            dates.push([formatDate(START), end]);
        else if (i === now.getFullYear())
            dates.push([start, formatDate(now)]);
        else 
            dates.push([start, end]);
    }

    return dates;
}

export const apodFetchAll = async () => {
    const range = generateRanges();
    const paramBase = { api_key: process.env.NASA ?? 'DEMO_KEY' };

    const images: { title: string, link: string, copyright: string | null }[] = [];
    for (const [start, end] of range) {
        const params = new URLSearchParams({ 
            start_date: start,
            end_date: end,
            ...paramBase
        }).toString();

        const r = await fetch(`${APOD_API_URL}${params}`);
        if (!r.ok) continue;

        const j = await r.json() as IAPOD[] | IAPOD;
        // https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&date=2006-05-29
        // some "pictures of the day" are not actually pictures, so we need to filter
        // these out.
        const f = (Array.isArray(j) ? j : [j]).filter(a => a.title && (a.hdurl || a.url));

        for (const { title, hdurl, url, copyright } of f) 
            images.push({ title: title, link: hdurl ?? url, copyright: copyright ?? null });
    }

    return images;
}

export const apodFetchDaily = async () => {
    setInterval(async () => {
        const r = await fetch(`${APOD_API_URL}api_key=${process.env.NASA}`);
        if (!r.ok) return;
        const j = await r.json() as IAPOD;
        return nasaInsert({ title: j.title, link: j.hdurl ?? j.url, copyright: j.copyright ?? null });
    }, 60 * 1000 * 60);
}
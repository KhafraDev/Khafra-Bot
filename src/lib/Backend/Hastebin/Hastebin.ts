import fetch, { Response } from 'node-fetch';
import { HastebinPost } from './types/Hastebin';

export const hasteServers: Record<string, string> = {
    'hastebin': 'https://hastebin.com/documents',
    'nomsy'   : 'https://paste.nomsy.net/documents'
}

export const paste = async (paste: string, server = 'https://hastebin.com/documents') => {
    const srv = Object.entries(hasteServers).filter(([n, u]) => n === server.toLowerCase() || u === server.toLowerCase());

    let res: Response;
    try {
        res = await fetch(srv.shift().pop(), {
            method: 'POST',
            body: paste
        });
    } catch(e) {
        return Promise.reject(e.toString());
    }

    if(res.ok) {
        return res.json() as Promise<HastebinPost>;
    } else {
        return Promise.reject(`Received ${res.status} (${res.statusText}).`);
    }
}
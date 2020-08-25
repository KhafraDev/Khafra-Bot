import fetch from 'node-fetch';
import { HastebinPost } from './types/Hastebin';

export const hasteServers = {
    'hastebin': 'https://hastebin.com/documents',
    'nomsy'   : 'https://paste.nomsy.net/documents'
}

export const paste = async (paste: string, server = 'https://hastebin.com/documents') => {
    const srv = Object.entries(hasteServers).filter(([n, u]) => n === server.toLowerCase() || u === server.toLowerCase());

    if(srv.length === 0) {
        return {
            error: 'No server with that name found!'
        }
    }

    const res = await fetch(srv.shift().pop(), {
        method: 'POST',
        body: paste
    });

    if(res.ok) {
        return res.json() as Promise<HastebinPost>;
    } else {
        return res;
    }
}
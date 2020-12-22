import fetch from 'node-fetch';
import qs from 'querystring';

export interface BoiledArtist {
    edges: string[]    
    followers: number
    genres: string[]   
    id: string
    image: string
    incoming_edges: string[]
    name: string
    popularity: number
    tracks: {
        audio: string
        id: string
        image: string
        name: string
    }[]
}

export interface Boiled {
    fdelta: number  
    path: BoiledArtist[]
    pdelta: number
    raw_path: string[]
    score: number
    status: 'ok'
}

interface Overboiled {
    reason: string
    status: 'error'
}

const BoiledError = class extends Error { constructor(m: string) { super(m); this.name = 'BoiledError'; } }
const base = 'http://frog.playlistmachinery.com:4682/frog/path?';

export const boilTheFrog = async (a: string, b: string): Promise<Boiled> => {
    const q = qs.stringify(
        { src: a, dest: b, skips: '' }, 
        null, null, 
        { encodeURIComponent: s => encodeURIComponent(s).replace(/%20/g, '+') }
    );

    const res = await fetch(`${base}${q}`);
    const json = await res.json() as Boiled | Overboiled;

    if(json.status === 'error') {
        return Promise.reject(new BoiledError(json.reason));
    }

    return Promise.resolve(json);
}
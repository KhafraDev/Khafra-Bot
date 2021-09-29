import { fetch } from 'undici';
import { URL, URLSearchParams } from 'url';
import { SpotifyResult } from './types/Spotify';

type Token = { 
    access_token: string;
    token_type: string; 
    expires_in: number;
    scope?: string;
}

class Spotify {
    #id = process.env.SPOTIFY_ID;
    #secret = process.env.SPOTIFY_SECRET;

    #token: Token | null = null;
    #expires_in: number | null = null;

    async search(query: string) {
        // URLSearchParams encodes differently (and incorrectly for Spotify), so we use qs#stringify instead.
        const params = '?' + new URLSearchParams({
            type: 'track',
            limit: '10',
            q: query // automatically encoded
        }).toString().replace(/\+/g, '%20');

        const token = await this.getTokenHeader();

        return fetch(new URL(params, 'https://api.spotify.com/v1/search'), {
            headers: { 
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...token
            }
        })
        .then(res => res.json() as Promise<SpotifyResult>);
    }
  
    async setToken() {
        const params = new URLSearchParams({ grant_type: 'client_credentials' });

        return fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            body: params,
            headers: {
                Authorization: `Basic ${Buffer.from(`${this.#id}:${this.#secret}`).toString('base64')}`
            }
        })
        .then(res => res.json() as Promise<Token>)
        .then(creds => {
            this.#token = creds;
            this.#expires_in = Date.now() + creds.expires_in * 1000; // in milliseconds
        });
    }
  
    async getTokenHeader() {
        if (!this.#token || !this.#token.access_token || this.expired) {
            await this.setToken();
        }

        return { Authorization: `Bearer ${this.#token!.access_token}` };
    }

    get expired() {
        return this.#token && Date.now() >= this.#expires_in!;
    }
}

export const spotify = new Spotify();
import fetch from "node-fetch";
import { URLSearchParams } from "url";
import { SpotifyResult } from "../types/spotify.i";

class Spotify {
    private id = process.env.SPOTIFY_ID;
    private secret = process.env.SPOTIFY_SECRET;

    token: { 
        access_token: string;
        token_type: string; 
        expires_in: number;
        scope?: string;
    };

    expires_in: number;

    async search(query: string) {
        const token = await this.getTokenHeader();
        return fetch('https://api.spotify.com/v1/search?type=track&limit=10&q=' + encodeURIComponent(query), {
            headers: { 
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...token
            }
        })
        .then(res => res.json() as Promise<SpotifyResult>);
    }
  
    async setToken() {
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');

        return fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            body: params,
            headers: {
                Authorization: `Basic ${Buffer.from(`${this.id}:${this.secret}`).toString('base64')}`
            }
        })
        .then(res => res.json())
        .then(creds => {
            this.token = creds;
            this.expires_in = new Date().getTime() + creds.expires_in * 1000; // in milliseconds
        });
    }
  
    async getTokenHeader() {
        if(!this.token || !this.token.access_token || this.expired) {
            await this.setToken();
        }

        return { Authorization: `Bearer ${this.token.access_token}` };
    }

    get expired() {
        return this.token && new Date().getTime() >= this.expires_in
            ? true
            : false;
    }
}

const spotify = new Spotify();
export { spotify };
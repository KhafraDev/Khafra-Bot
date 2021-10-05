import { SpotifyResult } from './types/Spotify';
declare class Spotify {
    #private;
    search(query: string): Promise<SpotifyResult>;
    setToken(): Promise<void>;
    getTokenHeader(): Promise<{
        Authorization: string;
    }>;
    get expired(): boolean | null;
}
export declare const spotify: Spotify;
export {};

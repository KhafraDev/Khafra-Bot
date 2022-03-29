import { SpotifyResult } from './types/Spotify';
declare class Spotify {
    #private;
    search(query: string): Promise<SpotifyResult>;
    setToken(): Promise<void>;
    getTokenHeader(): Promise<{
        Authorization: string;
    }>;
    get expired(): boolean;
}
export declare const spotify: Spotify;
export {};

type ExternalURL = {
    spotify: string
    [key: string]: string
}

type SpotifyArtist = {
    external_urls: ExternalURL
    href: string,
    id: string,
    name: string,
    type: string,
    uri: string
}

type SpotifyItem = {
    album: {
        album_type: string,
        artists: SpotifyArtist[],
        available_markets: string[]
        external_urls: ExternalURL
        href: string,
        id: string,
        images: {
            height: number,
            url: string,
            width: number
        }[],
        name: string,
        release_date: string,
        release_date_precision: string | null,
        total_tracks: number,
        type: string,
        uri: string
    },
    artists: SpotifyArtist[],
    available_markets: string[],
    disc_number: number,
    duration_ms: number,
    explicit: boolean,
    external_ids: {
        isrc: string
    },
    external_urls: ExternalURL
    href: string,
    id: string,
    is_local: boolean,
    name: string,
    popularity: number,
    preview_url: string,
    track_number: number,
    type: string,
    uri: string
}

export type SpotifyResult = {
    tracks: {
        href: string,
        items: SpotifyItem[],
        limit: number,
        next: string | null,
        offset: number,
        previous: string | null,
        total: number
    }
}

declare class Spotify {
    private id;
    private secret;
    private token;
    private expires_in;
    search(query: string): Promise<SpotifyResult>;
    setToken(): Promise<void>;
    getTokenHeader(): Promise<{
        Authorization: string;
    }>;
    get expired(): boolean | null;
}

export declare const spotify: Spotify;
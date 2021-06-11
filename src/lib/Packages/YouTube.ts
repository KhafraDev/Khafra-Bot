import fetch from 'node-fetch';
import { URLSearchParams } from 'url';

interface YouTubeError {
    error: {
        code: number,
        message: string,
        errors: unknown[],
        status: string
    }
}

export interface YouTubeSearchResults {
    kind: 'youtube#searchListResponse',
    etag: string,
    nextPageToken: string,
    regionCode: string,
    pageInfo: { totalResults: number, resultsPerPage: number },
    items: {
        kind: 'youtube#searchResult',
        etag: string,
        id: { kind: 'youtube#video', videoId: string },
        snippet: {
            publishedAt: Date,
            channelId: string,
            title: string,
            description: string,
            thumbnails: {
                [key in 'default' | 'medium' | 'high']: {
                    url: string,
                    width: number,
                    height: number
                }
            },
            channelTitle: string,
            liveBroadcastContent: string,
            publishTime: Date
        }
    }[]
}

export const YouTube = async (q: string[]) => {
    const params = new URLSearchParams();
    params.append('part', 'snippet');
    params.append('q', encodeURIComponent(q.join(' ').replace(/\s+/, '+')));
    params.append('type', 'video');
    params.append('key', process.env.GOOGLE_API!);


    const r = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`)
    const j = await r.json() as YouTubeSearchResults | YouTubeError;
    
    return j;
}
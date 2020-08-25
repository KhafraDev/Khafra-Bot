import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import { YouTubeSearchResults, YouTubeError } from './types/YouTube';

export const YouTube = async (q: string[]) => {
    const params = new URLSearchParams();
    params.append('part', 'snippet');
    params.append('q', encodeURIComponent(q.join(' ').replace(/\s+/, '+')));
    params.append('type', 'video');
    params.append('key', process.env.GOOGLE_API);

    const res = await fetch('https://www.googleapis.com/youtube/v3/search?' + params.toString());
    
    return res.json() as Promise<YouTubeSearchResults | YouTubeError>
}
import fetch from 'undici-fetch';
import { deepStrictEqual } from 'assert';

interface NobodyLiveApi {
    game_id: string,
    id: string,
    started_at: Date,
    thumbnail_url: string,
    title: string,
    ttl: number,
    user_id: string,
    user_name: string,
    viewer_count: 0 
}

export const nobodyLive = async () => {
    const res = await fetch('https://nobody.live/stream');
    const json = await res.json() as NobodyLiveApi;
    
    deepStrictEqual('thumbnail_url' in json, true);
    deepStrictEqual('user_name' in json, true);
    deepStrictEqual('title' in json, true);

    return {
        thumbnail_url: json.thumbnail_url.replace(/{(.*?)}/g, (_, dim: string) => dim === 'width' ? '440' : '248'),
        title: json.title,
        url: `https://twitch.tv/${json.user_name}`
    }
}
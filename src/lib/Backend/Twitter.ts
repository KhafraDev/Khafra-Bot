/**
 * If you would like to see how documentation should be written,
 * look at how Twitter does it, and then do the EXACT OPPOSITE.
 */

import fetch from 'node-fetch';

interface Media {
    bitrate?: number
    url: string
    content_type: string
}

let token: string | null = null;

const getTwitterOAUTH = async () => {
    const creds = Buffer.from(`${process.env.TWITTER_API}:${process.env.TWITTER_API_SECRET}`).toString('base64');
    const r = await fetch('https://api.twitter.com/oauth2/token', {
        method: 'POST',
        body: 'grant_type=client_credentials',
        headers: {
            Authorization: `Basic ${creds}`,
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        }
    });
    const j = await r.json();
    return j.access_token;
}

export const getTwitterMediaURL = async (id: string): Promise<string> => {
    token ??= await getTwitterOAUTH();

    const r = await fetch(`https://api.twitter.com/1.1/statuses/show.json?id=${id}&include_entities=true&tweet_mode=extended`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    
    const j = await r.json();
    const media = j.extended_entities?.media;
    if (!media || media.length === 0) 
        return;

    if (media[0].type === 'video' || media[0].type === 'animated_gif') {
        const medias = media[0].video_info.variants as Media[];
        return medias
            .filter(u => u.content_type !== 'application/x-mpegURL')
            .map(m => m.url)
            .join('\n');
    }

    return media
        .map((m: { media_url_https: string; }) => m.media_url_https)
        .join('\n');
}
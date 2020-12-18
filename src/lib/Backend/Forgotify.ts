import fetch from 'node-fetch';

export const forgotify = async () => {
    const res = await fetch('https://forgotify.com/player.cfm');
    const html = await res.text();

    const title = html.match(/<title>(.*?)<\/title>/)[1];
    const embedURL = html.match(/spotEmbedURL = '(.*?)'/)[1].split(':').pop();

    return {
        title,
        url: `https://open.spotify.com/embed/track/${embedURL}`
    }
}
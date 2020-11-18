import fetch, { Response, RequestInit } from 'node-fetch';
import { URL } from 'url';

interface PasteServer {
    url: string
    alias: string[]
    /**
     * Format for request body
     * @example `text={{text}}`
     */
    format: string
    req?: Partial<RequestInit>
    text?: boolean
}

export const hasteServers: PasteServer[] = [
    {
        url: 'https://hastebin.com/documents',
        alias: ['hastebin'],
        format: `{{text}}`
    },
    {
        url: 'https://paste.nomsy.net/documents',
        alias: ['nomsy'],
        format: `{{text}}`
    },
    {
        url: 'https://hatebin.com/index.php',
        alias: ['hatebin'],
        format: `text={{enctext}}`,
        text: true,
        req: {
            headers: {
                'Content-type': 'application/x-www-form-urlencoded'
            }
        }
    }
];

export const Paste = async (server: string, text: string) => {
    server = server.toLowerCase();
    const supported = hasteServers.some(s => s.url === server || s.alias.includes(server));
    if(!supported) {
        return Promise.reject('Server not supported');
    }

    const pasteServer = hasteServers.filter(s => 
        s.url === server || s.alias.includes(server)
    ).shift()!;
    const paste = pasteServer.format.replace(/{{(enc)?text}}/, c => 
        c.includes('enc') ? encodeURIComponent(text) : text
    );

    let res: Response;
    try {
        res = await fetch(pasteServer.url, {
            method: pasteServer.req?.method ?? 'POST',
            headers: pasteServer.req?.headers ?? {},
            body: paste
        });
    } catch(e) {
        return Promise.reject(e);
    }

    const { origin } = new URL(pasteServer.url);
    if(!res.ok) {
        return Promise.reject('Response wasn\'t ok.');
    }

    let key;
    try {
        key = pasteServer.text ? await res.text() : await res.json();
    } catch(e) {
        return Promise.reject(e);
    }

    return `${origin}/${typeof key === 'object' ? key.key : key.trim()}`;
}
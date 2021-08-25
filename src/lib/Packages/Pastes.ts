import { fetch } from 'undici';
import { URL, URLSearchParams } from 'url';

export type PasteFn = (text: string) => Promise<string | undefined>;

export interface HasteServer {
    key: string
}

export interface ISourcebin {
    key: string
    languages: string[]
}

export interface PasteGGSuccess {
    status: 'success'
    result: {
        id: string
        name: string
        description: string
        visibility: string
        created_at: string
        updated_at: string
        expires?: string
        files: {
            highlight_language: string | null
            id: string
            name: string
        }[]
        deletion_key?: string
    }
}

export interface PasteGGError {
    status: 'error'
    error: string
    message?: string
}

/**
 * Upload text to hatebin.com
 * 
 * Seems to have issues with the word "function" (for whatever reason).
 */
const hatebin = async (text: string) => {
    const r = await fetch('https://hatebin.com/index.php', {
        method: 'POST',
        body: `text=${encodeURIComponent(text)}`,
        headers: { 'Content-type': 'application/x-www-form-urlencoded' }
    });

    if (r.ok) return `https://hatebin.com/${(await r.text()).trim()}`;
}

/**
 * Upload text to https://sourceb.in
 */
const sourcebin = async (text: string) => {
    const r = await fetch('https://sourceb.in/api/bins', {
        method: 'POST',
        body: JSON.stringify({
            files: [ { content: text } ]
        }),
        headers: { 'Content-Type': 'application/json;charset=utf-8' }
    });

    if (r.ok) {
        const j = await r.json() as ISourcebin;
        return `https://sourceb.in/${j.key}`;
    } 
}

/**
 * Upload text to https://paste.nomsy.net
 */
const nomsy = async (text: string) => {
    const r = await fetch('https://paste.nomsy.net/documents', {
        method: 'POST',
        body: text,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });

    if (r.ok) {
        const j = await r.json() as HasteServer;
        return `https://paste.nomsy.net/${j.key}`;
    } 
}

/**
 * Upload text to https://paste.gg
 * @see https://github.com/ascclemens/paste/blob/master/api.md#post-pastes
 */
const pastegg = async (text: string) => {
    const r = await fetch('https://api.paste.gg/v1/pastes', {
        method: 'POST',
        body: JSON.stringify({
            visibility: 'unlisted',
            files: [ { content: { format: 'text', value: text } } ]
        }),
        headers: { 'Content-Type': 'application/json' }
    });

    if (r.ok) {
        const j = await r.json() as PasteGGError | PasteGGSuccess;
        if (j.status === 'success')
            return `https://paste.gg/anonymous/${j.result.id}`;
    }
}

/**
 * Upload text to https://ghostbin.co/
 */
const ghostbin = async (text: string) => {
    const r = await fetch('https://ghostbin.co/paste/new', {
        method: 'POST',
        body: new URLSearchParams({
            lang: 'text',
            text, 
            expire: '-1', 
            password: '', 
            title: ''
        }),
        redirect: 'manual'
    });

    if (r.status === 303)
        return new URL(r.headers.get('location')!, 'https://ghostbin.co').toString();
}

/**
 * List of aliases with the corresponding function.
 */
export const pasteAliases = new Map<string, PasteFn>([
    ['hatebin', hatebin],
    ['sourcebin', sourcebin],
    ['nomsy', nomsy],
    ['paste', pastegg],
    ['pastegg', pastegg],
    ['ghostbin', ghostbin]
]);
import fetch from 'node-fetch';
import parse5, { 
    DefaultTreeParentNode as DTPN, 
    DefaultTreeElement as DTE,
    DefaultTreeTextNode as DTTN
} from 'parse5';

export interface OnionArticle {
    href: string,
    title: string,
    date?: Date
}

export const months: Record<number, string> = {
    1: 'january', 2: 'february', 3: 'march', 4: 'april',
    5: 'may', 6: 'june', 7: 'july', 8: 'august',
    9: 'september', 10: 'october', 11: 'november', 12: 'december'
}

const sitemap = () => {
    const list = Array<string>();
    for(let i = 2002; i <= new Date().getFullYear(); i++) {
        for(let m = 1; m <= 12; m++) {
            list.push(`https://local.theonion.com/sitemap/${i}/${months[m]}`);
        }
    }

    return list.slice(0, -1); // current month isn't completed
}

const parseSitemap = async (s?: string[]) => {
    const a = [];
    const err = [];
    for(const url of s ?? sitemap()) {   
        let res;
        try {
            res = await fetch(url);
        } catch(e) {
            err.push(e);
            continue;
        }
        const html = await res.text();

        const document = parse5.parse(html);
        const els = (document as DTPN).childNodes; // elements in the page's body

        while(els.length > 0) {
            const el = els.shift() as DTE | DTPN;
            if(el.nodeName === 'a') {
                if('attrs' in el && el.attrs.length > 0) {
                    if(el.attrs.some(a => a.value.includes('js_sitemap-day'))) {
                        a.push(...el.attrs
                            .filter(a => a.name === 'href')
                            .map(a => 'https://local.theonion.com' + a.value)
                        );
                    }
                }
            }
            
            if('childNodes' in el) {
                els.push(...el.childNodes);
            }
        }
    }

    return { a, errors: err }
}

export const getArticles = async (s?: string[]) => {
    const a = [];

    const links = await parseSitemap(s);
    for(const url of links.a) {
        let res;
        try {
            res = await fetch(url);
        } catch(e) {
            links.errors.push(e);
            continue;
        }
        const html = await res.text();

        const document = parse5.parse(html);
        const els = (document as DTPN).childNodes; // elements in the page's body

        while(els.length > 0) {
            const el = els.shift() as DTE | DTPN;
            if(el.nodeName === 'a') {
                if('attrs' in el && el.attrs.length > 0) {
                    if(el.attrs.every(a => a.name !== 'itemprop')) {
                        const [d, m, y] = url.split('/').reverse();
                        const item = {
                            href: el.attrs.filter(a => a.name === 'href').shift()!.value,
                            title: (el.childNodes[0] as DTTN).value,
                            date: new Date(`${m} ${d}, ${y} GMT-0`)
                        }
                        a.push(item);
                    }
                }
            }
            
            if('childNodes' in el) {
                els.push(...el.childNodes);
            }
        }
    }

    return { articles: a, errors: links.errors }
}
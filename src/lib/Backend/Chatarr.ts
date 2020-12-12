import fetch from 'node-fetch';
import parse5, {
    DefaultTreeParentNode as DTPN,
    DefaultTreeElement as DTE,
    DefaultTreeTextNode as DTTN
} from 'parse5';

type article = { title: string, href: string, time: string };

// cache only saves the 10 most recent articles (pinned first)
export let cache: { c: null | article[] } = { c: null };
let interval: NodeJS.Timeout | null = null;

/** * News Aggregator. */
export const chatarr = async (): Promise<article[]> => {
    const res = await fetch('https://chatarr.com/ajax/world_news_ajax/world_news_ajax.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        body: 'method=fetch_all_news_on_home_page'
    });

    const html = await res.text();
    const document = parse5.parseFragment(html) as DTPN;
    const divs = document.childNodes.filter(n => n.nodeName === 'div').slice(0, 10);

    const articles: article[] = [];

    for(const a of divs) {
        // this was much cleaner with regular js
        const b = (a as DTPN).childNodes.find(e => e.nodeName === 'table');
        const c = (b as DTPN).childNodes.find(e => e.nodeName === 'tbody');
        const d = (c as DTPN).childNodes.find(e => e.nodeName === 'tr');
        const e = (d as DTPN).childNodes.filter(e => e.nodeName === 'td') as (DTPN & DTE)[];

        // "pinned" message is overwritten by the assignment
        const json: article = Object.assign({}, ...e.map(f => {
            if(f.childNodes.find(el => el.nodeName === 'a')) {
                const a = f.childNodes.find(el => el.nodeName === 'a') as DTE;
                return { 
                    title: a.attrs.find(el => el.name === 'title').value.trim(),
                    href: a.attrs.find(el => el.name === 'href').value.trim() 
                }
            } else {
                return { time: (f.childNodes[0] as DTTN).value.trim() }
            }
        }));

        articles.push(json);
    }

    return articles;
}

export const chatarrFetch = async () => {
    if(interval) return interval;

    try { cache.c = await chatarr() } catch {}

    interval = setInterval(async () => {
        try {
            cache.c = await chatarr();
        } catch {}
    }, 1000 * 60 * 5);

    return interval;
}
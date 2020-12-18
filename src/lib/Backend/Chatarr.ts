import fetch from 'node-fetch';
import parse5, {
    DefaultTreeParentNode as DTPN,
    DefaultTreeElement as DTE
} from 'parse5';
import { URLSearchParams, URL } from 'url';

type Element = DTE & DTPN;
type article = { title: string, href: string };

// cache only saves the 10 most recent articles (pinned first)
export let cache: { c: null | article[] } = { c: null };
let interval: NodeJS.Timeout | null = null;

/**
 * News Aggregator. 
 * @throws {TypeError | FetchError}
 */
export const chatarr = async (): Promise<article[]> => {
    const res = await fetch('https://chatarr.com/ajax/world_news_ajax/world_news_ajax.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        body: 'method=fetch_all_news_on_home_page'
    });
    const html = await res.text();
    const document = parse5.parseFragment(html) as Element;

    const divs = (document.childNodes as Element[]).filter(n => 
        n.nodeName === 'div' && 
        n.attrs.some(a => a.name === 'id' && a.value === 'live_search_table')
    ).slice(0, 10);
    
    const articles = [];

    for(const el of divs) {
        const table = el.childNodes.find(n => n.nodeName === 'table') as Element;
        const tbody = table.childNodes.find(n => n.nodeName === 'tbody') as Element;

        const trs = (tbody.childNodes as Element[]).filter(n => n.nodeName === 'tr')
            .map(n => n.childNodes)
            .flat()
            .filter(n => n.nodeName !== '#text');

        const not_pinned = (trs as Element[]).find(n => n.attrs.every(a => 
            ['id', 'class'].includes(a.name) && 
            ['not_pinned', 'make_bold'].includes(a.value))
        );

        const a = not_pinned.childNodes.find(n => n.nodeName === 'a') as Element;
        const href = a.attrs.find(attr => attr.name === 'href').value;
        const title = parse5.serialize(a);

        articles.push({
            title: title.trim(),
            href: new URLSearchParams(new URL(href).search).get('url')
        });
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
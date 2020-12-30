import fetch from 'node-fetch';
import parse5, {
    DefaultTreeElement as DTE,
    DefaultTreeParentNode as DTPN
} from 'parse5';

let i = 0;
let interval: NodeJS.Timeout | null = null;
export const cache = new Map<number, { href: string, title: string }>();

type Element = DTE & DTPN;
type IBellingcatLoadMore = { template: string };

const parseTemplate = (html: string) => {
    const document = parse5.parseFragment(html) as Element;
    const articles = document.childNodes.filter(n => n.nodeName === 'article') as Element[];
    const all: { href: string, title: string }[] = [];

    for(const article of articles) {
        for(const child of article.childNodes as Element[]) {
            if(child.nodeName === '#text') continue;
            if(child.attrs.some(v => v.value === 'news_item__image')) {
                const a = child.childNodes.find(n => n.nodeName === 'a') as Element;
                const img = a.childNodes.find(n => n.nodeName === 'img') as Element;

                all.push({ 
                    href: a.attrs.find(a => a.name === 'href').value,
                    title: img.attrs.find(a => a.name === 'alt').value 
                });
            }
        }
    }

    return all;
}

export const fetchTemplate = async () => {
    const res = await fetch('https://www.bellingcat.com/wp-json/facetwp/v1/refresh', {
        method: 'POST',    
        headers: {
            'Accept': 'text/plain, */*; q=0.01',
            'Accept-Language': 'en-US,en;q=0.5',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': 'https://www.bellingcat.com/category/news/'
        },
        body: 'action=facetwp_refresh&data%5Bfacets%5D=%7B%22categories%22%3A%5B%5D%2C%22tags%22%3A%5B%5D%2C%22load_more%22%3A%5B%5D%7D&data%5Bhttp_params%5D%5Buri%5D=category%2Fnews&data%5Bhttp_params%5D%5Barchive_args%5D%5Bcat%5D=4&data%5Btemplate%5D=overview_category&data%5Bextras%5D%5Bsort%5D=default&data%5Bsoft_refresh%5D=0&data%5Bis_bfcache%5D=0&data%5Bfirst_load%5D=0&data%5Bpaged%5D=0'
    });
    const json = await res.json() as IBellingcatLoadMore;
    
    return parseTemplate(json.template);
}

const safeFetch = async () => {
    try {
        const articles = await fetchTemplate();
        cache.clear();
        articles.forEach(a => cache.set(i++, a));
    } catch {}
}

export const bellingcatInterval = async () => {
    if(interval) return interval;

    await safeFetch();
    interval = setInterval(safeFetch, 60 * 1000 * 60); 

    return interval;
}
import fetch from 'node-fetch';

const months: { [key: number]: string } = {
    1: 'january',
    2: 'february',
    3: 'march',
    4: 'april',
    5: 'may',
    6: 'june',
    7: 'july',
    8: 'august',
    9: 'september',
    10: 'october',
    11: 'november',
    12: 'december'
}

const sitemap = () => {
    const year = new Date().getFullYear();
    const month = Object.keys(months).indexOf(new Date().getMonth() + 1 + '') + 1;

    const map: { [key: number]: string[] } = {};
     
    for(let i = 2002; i < year + 1; i++) { // years
        map[i] = Array.from(
            Array(i === year ? month : 12),
            (_, v) => `https://local.theonion.com/sitemap/${i}/${months[v + 1]}`
        );
    }

    return map;
}

const sitemapURLsFromHTML = async () => {
    const parsed: { [key: string]: string[] } = {};

    for(const [year, urls] of Object.entries(sitemap())) {
        for(const url of urls) {
            const res = await fetch(url);
            if(res.status !== 200) {
                return res;
            }
            
            const html = await res.text();
            const a = html.match(/<a class="[\s\S]*?" href="[\s\S]*?">\d+<\/a>/g);
            const u = a.map(el => 'https://local.theonion.com' + el.match(/\/sitemap\/\d+\/.*\/\d{1,2}/g));
            
            if(parsed[year]) {
                parsed[year].push(...u);
            } else {
                parsed[year] = u;
            }
        }
    }

    return parsed;
}

export const articlesFromSitemap = async () => {
    const articles: { href: string, title: string }[] = [];
    for(const [, urls] of Object.entries(await sitemapURLsFromHTML())) {
        for(const url of urls) {
            const res = await fetch(url);
            const html = await res.text();

            const m = html.match(/<a href="https:(.*?)">(.*?)<\/a>/g);
            for(const r of m) {
                const [href, title] = r.match(/"https(.*?)"|>(.*?)</g).map(u => u.slice(1, -1))
                articles.push({ href, title });
            }
        }
    }

    return articles;
}
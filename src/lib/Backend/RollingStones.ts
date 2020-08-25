import { AllHtmlEntities } from 'html-entities';
import fetch from 'node-fetch';
import { pool } from '../../Structures/Database/Mongo';
 
const entities = new AllHtmlEntities();

const parseHTML = (html: string) => {
    /**
     * All article tags on a page that are part of the list. No advertisements or other irrelevant tags.
     * @see https://stackoverflow.com/a/16880892
     */
    const articles: string[] = html.match(/<article(.*?)class="c-list__item"[\s\S]*?<\/article>/g);
    const items = [];
    for(const article of articles) {
        /*** The image URL. `<img src="...">` might be base64. */
        const image = article.match(/<img.*data-src="(.*?)"[\s\S]*?<\/div>/)?.[1];
        const num = article.match(/data-list-item="(\d+)"/)?.[1];
        const title = article.match(/data-list-title="(.*?)"/)?.[1];
        const permalink = article.match(/data-list-permalink="(.*?)"/)?.[1]
        /** @see https://stackoverflow.com/a/1499916 */
        const bio = article.match(/<p>(.*)<\/p>/g)?.map(line => 
            entities.decode(line.replace(/(<([^>]+)>)/ig, ''))
        ).join('\n');

        items.push({
            image,
            place: +num,
            title: title ? entities.decode(title) : title,
            permalink,
            bio
        });
    }

    return items;
}

export const insert = async () => {
    const client = await pool.commands.connect();
    const collection = client.db('khafrabot').collection('rollingstones');

    for(let i = 1; i <= 10; i++) {
        const res = await fetch(`https://www.rollingstone.com/music/music-lists/500-greatest-songs-of-all-time-151127/?list_page=${i}`);
        const text = await res.text();
        const items = parseHTML(text);
        await collection.insertMany(items);
    }
}
import fetch from 'node-fetch';
import { DiscordDiscoverResults } from './types/DiscordDiscover';

const search = 'https://nktzz4aizu-dsn.algolia.net/1/indexes/prod_discoverable_guilds/query?x-algolia-agent=Algolia%20for%20JavaScript%20(4.1.0)%3B%20Browser';

export const DiscordDiscover = async (query: string) => {
    const res = await fetch(search, {
        method: 'POST',
        body: JSON.stringify({ 
            query,
            filters: 'auto_removed: false AND approximate_presence_count > 0 AND approximate_member_count > 0',
            optionalFilters: [ 'preferred_locale: en-US' ],
            length: 1,
            offset: 0,
            restrictSearchableAttributes: [
                'name',
                'description',
                'keywords',
                'categories.name.default',
                'categories.name.en-US',
                'primary_category.name.default',
                'primary_category.name.en-US',
                'vanity_url_code'
            ]
        }),
        headers: {
            'Host': 'nktzz4aizu-dsn.algolia.net',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'x-algolia-api-key': 'aca0d7082e4e63af5ba5917d5e96bed0', // taken from Discord
            'x-algolia-application-id': 'NKTZZ4AIZU',                // taken from Discord
            'content-type': 'application/x-www-form-urlencoded'
        }
    });

    if(res.ok) {
        return res.json() as Promise<DiscordDiscoverResults>;
    } else {
        return Promise.reject(new Error(`${res.status} ${res.statusText}`));
    }
}
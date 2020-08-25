import fetch from 'node-fetch';
import { ViewedArticle } from './types/NYTimes';

const cache = {
    viewed: null as ViewedArticle
}

export const nytimes = {
    viewed: async () => {
        if(cache.viewed) {
            return Promise.resolve(cache.viewed);
        }

        const r = await fetch('https://api.nytimes.com/svc/mostpopular/v2/viewed/1.json?api-key=' + process.env.NYTIMES);
        const res = await r.json() as ViewedArticle;

        cache.viewed = res;
        setTimeout(() => cache.viewed = null, 5 * 60 * 1000); // clear after 5 minutes    

        return res;
    }
}
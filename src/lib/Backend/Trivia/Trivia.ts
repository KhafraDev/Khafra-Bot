import fetch from 'node-fetch';
import { Question } from './types/Trivia';

export const categories: { id: number, name: string }[] = [];
export let categoryRegex: RegExp | null = null;

export const Trivia = {
    fetchList: async () => {
        if(categories.length > 0) {
            return categories;
        }

        const res = await fetch('https://opentdb.com/api_category.php');

        if(res.status === 200) {
            categories.push(...(await res.json()).trivia_categories);
            categoryRegex = new RegExp(categories.map(c => c.name).join('|'), 'gi');
        }

        return categories;
    },

    fetchAllQuestions: async () => {
        const questions: Question[] = [];
        const token = await (await fetch('https://opentdb.com/api_token.php?command=request')).json();

        if(token.response_code !== 0) {
            throw token;
        }

        while(true) {
            const res = await fetch(`https://opentdb.com/api.php?amount=50&token=${token.token}`);
            const json = await res.json();

            if(json.response_code === 0) {
                questions.push(...json.results);
            } else {
                break;
            }
        }
        
        return questions;
    }
}
import fetch from 'node-fetch';
import { Question } from './types/Trivia';

const shuffle = <T>(a: T[]): T[] => {
    for(let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export const categories: { id: number, name: string }[] = [];
// push questions to existing array (if exists already)
// or set the questions to a new array.
// Proxy is amazing. 
export const questions = new Proxy({} as { [key: number]: Question[] }, {
    set: (target, prop: number, value) => {
        if(prop in target) {
            target[prop].push(...value);
        } else {
            target[prop] = [...value];
        }

        return true;
    }
});
export let categoryRegex: RegExp = null;

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

    fetchQuestions: async (amount: number, category: number, difficulty: 'easy' | 'medium' | 'hard') => {
        if(category in questions && questions[category].length >= amount) {
            return shuffle(questions[category]).splice(0, amount);
        }

        const base = `https://opentdb.com/api.php?amount=50&category=${category}&difficulty=${difficulty}`;
        const res = await fetch(base);

        if(res.status === 200) {
            const json = await res.json();
            if(json.response_code === 0) {
                questions[category] = json.results;
                return shuffle(questions[category]).splice(0, amount);
            } else {
                return null;
            }
        }
    }
}
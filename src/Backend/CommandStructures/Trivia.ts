import fetch from 'node-fetch';
import { TriviaList, TriviaQuestions } from '../types/Trivia';

class Trivia {
    listCache: TriviaList

    async fetchList() {
        if(this.listCache) {
            return Promise.resolve(this.listCache);
        }

        const res = await fetch('https://opentdb.com/api_category.php');

        if(res.status === 200) {
            this.listCache = await res.json() as TriviaList;
        }

        return this.listCache;
    }

    async fetchQuestions(amount: number, category: number, difficulty: string) {
        const base = `https://opentdb.com/api.php?amount=${amount}&category=${category}&difficulty=${difficulty}&encode=base64`;
        const res = await fetch(base);

        if(res.status === 200) {
            const json = await res.json() as TriviaQuestions;
            if(json.response_code === 0) {
                return json;
            } else {
                return null;
            }
        }
    }
}

const trivia = new Trivia();

export { trivia };
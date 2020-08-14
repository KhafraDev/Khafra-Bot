export type TriviaList = {
    trivia_categories: {
        id: number,
        name: string
    }[]
};

export type TriviaQuestions = {
    response_code: 0 | 1 | 2 | 3 | 4,
    results: {
        category: string,
        type: string,
        difficulty: string,
        question: string,
        correct_answer: string,
        incorrect_answers: string[]
    }[]
}
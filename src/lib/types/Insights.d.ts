export interface InsightGuild {
    id: string;
    daily: {
        [key: string]: {
            /** Total number of uses in the server */
            total: number,
            /** Messages sent in a week */
            messages: number
        }
    }
}
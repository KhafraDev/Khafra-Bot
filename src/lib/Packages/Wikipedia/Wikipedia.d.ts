export interface WikipediaSearch {
    pages: {
        id: number
        key: string
        title: string
        excerpt: string
        description: string
        thumbnail: {
            mimetype: string,
            size?: number,
            width: number,
            height: number
            duration?: number
            url: string
        } | null
    }[]
}

export interface WikipediaSummary<T extends number> {
    batchcomplete: string
    query: {
        pages: {
            [key: string]: {
                pageid: T
                ns: number
                title: string
                extract: string
            }
        }
    }
}

/**
 * Search wikipedia using a given query. Returns an empty { pages: [...] } array if no results were found
 */
export declare const search: (query: string) => Promise<WikipediaSearch>;
/**
 * Using a pageid, get an article's summary
 */
export declare const getArticleById: (id: number) => Promise<WikipediaSummary<typeof id>>;

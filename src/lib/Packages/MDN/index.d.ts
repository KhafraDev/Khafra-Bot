export interface MDNSearchResult {
    mdn_url: string;
    score: number;
    title: string;
    locale: string;
    slug: string;
    popularity: number;
    archived: boolean;
    summary: string;
    highlight: {
        body: string[];
        title: string[];
    };
}
export interface MDNResult {
    documents: MDNSearchResult[];
    metadata: {
        took_ms: number;
        total: {
            value: number;
            relation: string;
        };
        size: number;
        page: 1;
    };
    suggestions: string[];
}
export interface MDNError {
    errors: {
        [key: string]: {
            message: string;
            code: string;
        }[];
    };
}
export declare const fetchMDN: (q: string, opts?: {
    locale: string;
}) => Promise<MDNResult | MDNError>;

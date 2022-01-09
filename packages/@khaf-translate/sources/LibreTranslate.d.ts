declare type Options = {
    to: string;
    from: string;
    query: string;
};
declare type APITranslatedResponse = {
    translatedText: string;
};
export declare const langs: string[];
export declare const getLanguages: () => Promise<string[]>;
export declare const translate: (options: Options) => Promise<APITranslatedResponse | null>;
export {};

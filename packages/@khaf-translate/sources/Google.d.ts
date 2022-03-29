declare type Opts = {
    to?: string;
    from?: string;
};
export declare const langs: string[];
export declare const translate: (text: string, opts?: Opts) => Promise<string>;
export {};

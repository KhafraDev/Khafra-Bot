interface Batch {
    batch: number[];
    wavNames: string[];
    scores: number[];
    torchmoji: (string | number)[];
    text_parsed: string[];
    tokenized: string[];
    dict_exists: string[][];
}
export declare class FifteenDotAI {
    static getWav(character: string, text: string): Promise<Batch | null>;
}
export {};

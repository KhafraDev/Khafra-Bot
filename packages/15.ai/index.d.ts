import { type InferType } from '@sapphire/shapeshift';
declare const schema: import("@sapphire/shapeshift").ObjectValidator<{
    batch: number[];
    wavNames: string[];
    scores: number[];
    torchmoji: number[] | string[];
    text_parsed: string[];
    tokenized: string[];
    dict_exists: string[][];
}, import("@sapphire/shapeshift").UndefinedToOptional<{
    batch: number[];
    wavNames: string[];
    scores: number[];
    torchmoji: number[] | string[];
    text_parsed: string[];
    tokenized: string[];
    dict_exists: string[][];
}>>;
type Batch = InferType<typeof schema>;
export declare class FifteenDotAI {
    static getWav(character: string, content: string, emotion: string): Promise<Batch | null>;
}
export {};

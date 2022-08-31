import { type InferType } from '@sapphire/shapeshift';
interface Options {
    to: string;
    from: string;
    query: string;
}
declare const translatedSchema: import("@sapphire/shapeshift").ObjectValidator<{
    translatedText: string;
}, import("@sapphire/shapeshift").UndefinedToOptional<{
    translatedText: string;
}>>;
export declare const langs: string[];
export declare const getLanguages: () => Promise<string[]>;
export declare const translate: (options: Options) => Promise<InferType<typeof translatedSchema> | null>;
export {};

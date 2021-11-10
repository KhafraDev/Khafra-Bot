/// <reference types="node" />
import { URL } from 'node:url';
export declare const bold: <C extends string>(content: C) => `**${C}**`;
export declare const italic: <C extends string>(content: C) => `_${C}_`;
export declare const underscore: <C extends string>(content: C) => `__${C}__`;
export declare function hideLinkEmbed<C extends string>(url: C): `<${C}>`;
export declare function hideLinkEmbed(url: URL): `<${string}>`;
export declare function codeBlock<L extends string, C extends string>(language: L, content: C): `\`\`\`${L}\n${C}\`\`\``;
export declare function codeBlock<C extends string>(content: C): `\`\`\`\n${C}\`\`\``;
export declare const inlineCode: <C extends string>(content: C) => `\`${C}\``;
export declare function hyperlink<C extends string, U extends string>(content: C, url: U): `[${C}](${U})`;
export declare function hyperlink<C extends string, U extends string, T extends string>(content: C, url: U, title: T): `[${C}](${U} "${T}")`;
declare type TimestampStyles = 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R';
export declare function time(date?: Date): `<t:${bigint}>`;
export declare function time<S extends TimestampStyles>(date: Date, style: S): `<t:${bigint}:${S}>`;
export declare function time<C extends number>(seconds: C): `<t:${C}>`;
export declare function time<C extends number, S extends TimestampStyles>(seconds: C, style: S): `<t:${C}:${S}>`;
export {};

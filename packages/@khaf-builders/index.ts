import { URL } from 'node:url';
import { isDate } from 'util/types';

export const bold = <C extends string>(content: C): `**${C}**` => `**${content}**`;

export const italic = <C extends string>(content: C): `_${C}_` => `_${content}_`;

export const underscore = <C extends string>(content: C): `__${C}__` => `__${content}__`;

export function hideLinkEmbed<C extends string>(url: C): `<${C}>`;
export function hideLinkEmbed(url: URL): `<${string}>`;
export function hideLinkEmbed(url: string | URL) {
    return `<${url}>`;
}

export function codeBlock<L extends string, C extends string>(language: L, content: C): `\`\`\`${L}\n${C}\`\`\``;
export function codeBlock<C extends string>(content: C): `\`\`\`\n${C}\`\`\``;
export function codeBlock(language: string, content?: string): string {
    if (content) {
        return `\`\`\`${language}\n${content}\`\`\``;
    }

	return `\`\`\`\n${language}\`\`\``;
}

export const inlineCode = <C extends string>(content: C): `\`${C}\`` => `\`${content}\``;

export function hyperlink<C extends string, U extends string>(content: C, url: U): `[${C}](${U})`;
export function hyperlink<C extends string, U extends string, T extends string>(content: C, url: U, title: T): `[${C}](${U} "${T}")`;
export function hyperlink(content: string, url: string, title?: string) {
    if (title) {
        return `[${content}](${url} "${title}")`;
    }

	return `[${content}](${url})`;
}

type TimestampStyles = 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R';

export function time(date?: Date): `<t:${bigint}>`;
export function time<S extends TimestampStyles>(date: Date, style: S): `<t:${bigint}:${S}>`;
export function time<C extends number>(seconds: C): `<t:${C}>`;
export function time<C extends number, S extends TimestampStyles>(seconds: C, style: S): `<t:${C}:${S}>`;
export function time(timeOrSeconds?: number | Date, style: TimestampStyles = 'f') {
    if (isDate(timeOrSeconds)) {
        timeOrSeconds = Math.floor(timeOrSeconds.getTime() / 1000);
    } else if (typeof timeOrSeconds === 'string') {
		timeOrSeconds = Math.floor(Date.now() / 1000);
	}

	return typeof style === 'string' ? `<t:${timeOrSeconds}:${style}>` : `<t:${timeOrSeconds}>`;
}
import { URLFactory } from '#khaf/utility/Valid/URL.js';
import type { Image, SKRSContext2D } from '@napi-rs/canvas';
import { extname } from 'path';

export class ImageUtil {
    /**
     * Splits text into different lines where each line is < maxWidth.
     */
    static split (
        text: string,
        maxWidth: number,
        ctx: SKRSContext2D
    ): string[] {
        const lines: string[] = [];

        let i = 0;
        let j = 0;
        let result = '';
        let width = 0;

        // stolen from https://stackoverflow.com/a/16221307/15299271
        while (text.length) {
            for (
                i = text.length;
                ctx.measureText(text.substring(0, i)).width > maxWidth;
                i--
            ) {}

            result = text.substring(0, i);

            if (i !== text.length) {
                for (
                    j = 0;
                    result.indexOf(' ', j) !== -1;
                    j = result.indexOf(' ', j) + 1
                ) {}
            }

            lines.push(result.substring(0, j || result.length));
            width = Math.max(width, ctx.measureText(lines.at(-1)!).width);
            text = text.substring(lines.at(-1)!.length, text.length);
        }

        return lines;
    }

    /**
     * Returns text up to maxWidth. Everything else if cut off.
     */
    static maxTextLength (
        text: string,
        maxWidth: number,
        ctx: SKRSContext2D | CanvasRenderingContext2D
    ): string {
        const split = [...text];
        let newText = '';

        while (ctx.measureText(newText + split[0]).width < maxWidth && split.length !== 0) {
            newText += split.shift();
        }

        return newText;
    }

    /**
     * Checks if a url is a supported image extension. Currently supports
     * `png`, `jp(e)g`, `avif`, `webp`.
     */
    static isImage (url: string): boolean {
        const u = URLFactory(url);

        const extension = extname(u ? u.toString() : url);
        const imageExts = [
            '.png',
            '.jpg',
            '.jpeg',
            '.avif',
            '.webp'
        ];

        return imageExts.includes(extension);
    }

    static centerImage (
        context: SKRSContext2D,
        image: Image,
        x: number,
        y: number,
        width: number,
        height: number
    ): void {
        context.drawImage(
            image,
            x - width / 2,
            y - height / 2,
            width,
            height
        );
    }
}
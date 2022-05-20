import * as Canvas from '@napi-rs/canvas';

declare module '@napi-rs/canvas' {
    interface TextMetrics {
        readonly width: number
        readonly actualBoundingBoxLeft: number
        readonly actualBoundingBoxRight: number
        readonly fontBoundingBoxAscent: number
        readonly fontBoundingBoxDescent: number
        readonly actualBoundingBoxAscent: number 
        readonly actualBoundingBoxDescent: number
        readonly emHeightAscent: number
        readonly emHeightDescent: number
        readonly hangingBaseline: number
        readonly alphabeticBaseline: number
        readonly ideographicBaseline: number
    }

    interface ImageData {
        readonly data: Uint8ClampedArray
        readonly height: number
        readonly width: number
    }

    interface SKRSContext2D {
        clearRect(x: number, y: number, width: number, height: number): void
        fillRect(x: number, y: number, width: number, height: number): void
        fillText(text: string, x: number, y: number, maxWidth?: number): void
        getImageData(sx: number, sy: number, sw: number, sh: number): ImageData
        measureText(text: string): TextMetrics
        putImageData(imageData: ImageData, dx: number, dy: number): void
        putImageData(
            imageData: ImageData,
            dx: number,
            dy: number,
            dirtyX: number,
            dirtyY: number,
            dirtyWidth: number,
            dirtyHeight: number
        ): void
        restore(): void
        rotate(angle: number): void
        save(): void
        translate(x: number, y: number): void
    }
}
import { Buffer } from 'node:buffer';

// https://fetch.spec.whatwg.org/#redirect-status
const redirectStatuses = [301, 302, 303, 307, 308];

export const isRedirect = (statusCode: number): boolean =>
    redirectStatuses.includes(statusCode);

export const arrayBufferToBuffer = (buffer: ArrayBuffer): Buffer => {
    if (ArrayBuffer.isView(buffer)) {
        return Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    }

    return Buffer.from(buffer, buffer.byteLength);
}
import type { Response, Dispatcher } from 'undici';

/**
 * Due to Node's GC, the fetch body might not be garbage collected reliably.
 * @see https://github.com/nodejs/undici#garbage-collection
 */
export const consumeBody = async (
    res: Response | null | { body: Dispatcher.ResponseData['body'] }
): Promise<void> => {
    if (!res?.body) return;

    for await (const _chunk of res.body) {}
}

// https://fetch.spec.whatwg.org/#redirect-status
const redirectStatuses = [301, 302, 303, 307, 308];

export const isRedirect = (statusCode: number): boolean =>
    redirectStatuses.includes(statusCode);
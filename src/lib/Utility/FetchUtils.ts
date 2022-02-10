import type { Response, Dispatcher } from 'undici';

/**
 * Due to Node's GC, the fetch body might not be garbage collected reliably.
 * @see https://github.com/nodejs/undici#garbage-collection 
 */
export const consumeBody = async (res: Response | Dispatcher.ResponseData | null): Promise<void> => {
    if (!res?.body) return;
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _chunk of res.body) {} 
}
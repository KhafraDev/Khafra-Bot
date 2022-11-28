import type { PocketAddResults, PocketGetResults } from './types/Pocket';
export declare class Pocket {
    consumer_key: string | undefined;
    redirect_uri?: string;
    request_token?: string;
    access_token?: string;
    username?: string;
    constructor(user?: {
        request_token: string;
        access_token: string;
        username: string;
    });
    requestCode(): Promise<string>;
    get requestAuthorization(): string;
    accessToken(): Promise<string>;
    getList(): Promise<PocketGetResults>;
    add(url: string | import('url').URL, title?: string): Promise<PocketAddResults>;
    encrypt(text: string): string;
    decrypt(hash: string): string;
    toObject(): {
        request_token: string;
        access_token: string;
        username: string | undefined;
    };
}

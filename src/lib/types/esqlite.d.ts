declare module 'esqlite' {
    type Callback<T> = (...args: [Error, null] | [null, T[]]) => void; 

    declare const version: string;

    export interface QueryOptions {
        prepareFlags?: number
        single?: boolean
        values?: Record<string, unknown>
    }

    export class Database {
        public constructor(path: string): Database;

        public autoCommitEnabled(): boolean;

        public close(): void;

        public interrupt(callback: () => unknown): void;

        public open(flag?: (typeof OPEN_FLAGS)[keyof typeof OPEN_FLAGS]): void;
        
        public query<T>(query: string, callback: Callback<T>): void;
        public query<T>(query: string, params: unknown[], callback: Callback<T>): void;
        public query<T>(query: string, params: QueryOptions, callback: Callback<T>): void;
    }

    const enum OPEN_FLAGS {
        READONLY = 0x00000001,
        READWRITE = 0x00000002,
        CREATE = 0x00000004,
        MEMORY = 0x00000080,
        SHAREDCACHE = 0x00020000,
        PRIVATECACHE = 0x00040000,
        NOFOLLOW = 0x01000000
    }

    const enum PREPARE_FLAGS {
        NO_VTAB = 0x04
    }

    export default {
        OPEN_FLAGS: OPEN_FLAGS,
        PREPARE_FLAGS: PREPARE_FLAGS,
        version: version
    }
}
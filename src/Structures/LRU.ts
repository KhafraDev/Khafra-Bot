import { setInterval } from 'timers';

interface LRUOptions {
    maxSize?: number
    maxAgeMs?: number
}

interface LRUCache<K extends string, V> {
    value: V
    modified: number
    next: K | null
    prev: K | null
}

export class LRU<K extends string, V> implements Map<K, V> {
    private options: LRUOptions = {};
    private cache = Object.create(null) as Record<K, LRUCache<K, V>>;
    private head: K | null = null;
    private tail: K | null = null;
    private length = 0;

    public constructor (opts: LRUOptions = {}) {
        this.options = { maxSize: opts.maxSize ?? 100, maxAgeMs: opts.maxAgeMs };

        if (opts.maxAgeMs) {
            setInterval(() => {
                const entries = Object.entries(this.cache) as [K, LRUCache<K, V>][];
                const now = Date.now();

                for (const [key, value] of entries) {
                    if (now - value.modified > opts.maxAgeMs!) {
                        this.delete(key);
                    }
                }
            }, opts.maxAgeMs);
        }
    }

    public delete (key: K): boolean {
        if (!(key in this.cache)) return false;

        const element = this.cache[key];
        delete this.cache[key];

        this.#unlink(key, element.prev as K, element.next as K);
        return true;
    }

    public set (key: K, value: V): this {
        let element: LRUCache<K, V>;

        if (key in this.cache) {
            element = this.cache[key];
            element.value = value;

            if (this.options.maxAgeMs) element.modified = Date.now();
            if (key === this.head) return this;

            this.#unlink(key, element.prev as K, element.next as K);
        } else {
            element = { value, modified: 0, next: null, prev: null };
            if (this.options.maxAgeMs) element.modified = Date.now();
            this.cache[key] = element;

            if (this.length === this.options.maxSize && this.tail)
                this.delete(this.tail);
        }

        this.length++;
        element.next = null;
        element.prev = this.head;

        if (this.head) this.cache[this.head].next = key;
        this.head = key;

        if (!this.tail) this.tail = key;
        return this;
    }

    public get (key: K): V | undefined {
        if (!(key in this.cache)) return undefined;

        const element = this.cache[key];

        if (this.options.maxAgeMs && (Date.now() - element.modified) > this.options.maxAgeMs) {
            this.delete(key);
            return undefined;
        }

        if (this.head !== key) {
            if (key === this.tail) {
                this.tail = element.next;
                this.cache[this.tail as K].prev = null;
            } else {
                // Set prev.next -> element.next:
                this.cache[element.prev as K].next = element.next;
            }

            // Set element.next.prev -> element.prev:
            this.cache[element.next as K].prev = element.prev;

            // Element is the new head
            this.cache[this.head as K].next = key;
            element.prev = this.head;
            element.next = null;
            this.head = key;
        }

        return element.value;
    }

    public has (key: K): boolean {
        return key in this.cache;
    }

    public clear (): void {
        this.cache = Object.create(null) as Record<K, LRUCache<K, V>>;
        this.head = null;
        this.tail = null;
        this.length = 0;
    }

    public forEach (callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: unknown): void {
        const entries = Object.entries(this.cache);

        for (const [key, value] of entries) {
            callbackfn.call(thisArg, value as V, key as K, this);
        }
    }

    public * entries (): IterableIterator<[K, V]> {
        for (const entry of Object.entries(this.cache)) {
            yield entry as [K, V];
        }
    }

    public * keys (): IterableIterator<K> {
        for (const key in this.cache) {
            yield key;
        }
    }

    public * values (): IterableIterator<V> {
        for (const value of Object.values(this.cache)) {
            yield value as V;
        }
    }

    public * [Symbol.iterator] (): IterableIterator<[K, V]> {
        for (const entry of this.entries()) {
            yield entry;
        }
    }

    public get [Symbol.toStringTag] (): string {
        return 'LRU';
    }

    public get size (): number {
        return this.length;
    }

    #unlink (key: K, prev: K, next: K): void {
        this.length--;

        if (this.length === 0) {
            this.head = null;
            this.tail = null;
        } else if (this.head === key) {
            this.head = prev;
            this.cache[this.head].next = null;
        } else if (this.tail === key) {
            this.tail = next;
            this.cache[this.tail].prev = null;
        } else {
            this.cache[prev].next = next;
            this.cache[next].prev = prev;
        }
    }
}
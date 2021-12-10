interface LRUOptions {
    maxSize?: number,
    maxAge?: number
}

type LRUCache<K extends string, V extends unknown> = {
    value: V,
    modified: number,
    next: K | null,
    prev: K | null
}

export class LRU<K extends string, V extends unknown> {
    private options: LRUOptions = {};
    private cache = Object.create(null) as Record<K, LRUCache<K, V>>;
    private head: K | null = null;
    private tail: K | null = null;
    private length = 0;

    public constructor (opts: LRUOptions = {}) {
        this.options = { maxSize: opts.maxSize ?? 100, maxAge: opts.maxAge ?? 0 };
    }

    public remove (key: K): boolean {
        if (!(key in this.cache)) return false;

        const element = this.cache[key];
        delete this.cache[key];

        this.unlink(key, element.prev as K, element.next as K);
        return true;
    }

    public peek (key: K) {
        if (!(key in this.cache)) return null;

        const element = this.cache[key];

        if (!this.checkAge(key, element)) return null;
        
        return element.value;
    }

    public set (key: K, value: V) {
        let element: LRUCache<K, V>;

        if (key in this.cache) {
            element = this.cache[key];
            element.value = value;
            
            if (this.options.maxAge) element.modified = Date.now();
            if (key === this.head) return value;

            this.unlink(key, element.prev as K, element.next as K);
        } else {
            element = { value, modified: 0, next: null, prev: null };
            if (this.options.maxAge) element.modified = Date.now();
            this.cache[key] = element;

            if (this.length === this.options.maxSize) this.evict();
        }

        this.length++;
        element.next = null;
        element.prev = this.head;

        if (this.head) this.cache[this.head].next = key;
        this.head = key;

        if (!this.tail) this.tail = key;
        return value;
    }

    public get (key: K) {
        if (!(key in this.cache)) return null;

        const element = this.cache[key];

        if (!this.checkAge(key, element)) return null;

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

    private unlink (key: K, prev: K, next: K) {
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

    private checkAge (key: K, element: LRUCache<K, V>) {
        if (this.options.maxAge && (Date.now() - element.modified) > this.options.maxAge) {
            this.remove(key);
            return false;
        }

        return true;
    }

    private evict () {
        if (!this.tail) return;
        this.remove(this.tail);
    }
}
import { Snowflake } from 'discord.js';

type UserCooldown = {
    added: number,
    notified?: boolean
}

export class Cooldown extends Map<Snowflake, UserCooldown> {
    /** @type {number} */
    #maxAge: number;

    /**
     * Max age of an item in seconds
     * @param {number} maxAge 
     */
    constructor(maxAge: number) {
        super();
        this.#maxAge = maxAge * 1_000;
        this.#createClearInterval();
    }

    #createClearInterval() {
        setInterval(() => {
            const maxAgeMs = this.#maxAge;
            const now = Date.now();

            for (const [id, { added }] of this.entries()) {
                if ((now - added) >= maxAgeMs) {
                    this.delete(id);
                }
            }
        }, this.#maxAge / 2);
    }

    isRateLimited(id: Snowflake): boolean {
        return this.has(id);
    }

    rateLimitUser(id: Snowflake): boolean {
        this.set(id, { added: Date.now() });
        return true;
    }

    /**
     * Whether or not a user has been notified that they're on cooldown. If they are haven't been, sets that they have been.
     * @param {Snowflake} id 
     * @returns {boolean} true if the user has been notified, false if they haven't been, null if not on cooldown
     */
    isNotified(id: Snowflake): boolean | null {
        const info = this.get(id);
        if (!info) return null;
        if (info.notified) return true;

        info.notified = true;
        this.set(id, info);
        
        return false;
    }

    get rateLimitSeconds(): number {
        return this.#maxAge / 1000;
    }
}
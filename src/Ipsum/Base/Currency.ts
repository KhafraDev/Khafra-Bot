interface CurrencyOptions {
    allowNegative: boolean;
    allowFloats: boolean;
}

export class Currency {
    static MAX = 2 ** 53 - 1;
    #amount: number;
    #options: CurrencyOptions;

    public constructor(
        amount: number,
        options: CurrencyOptions = {
            allowNegative: false,
            allowFloats: false
        }
    ) {
        this.#amount = amount;
        this.#options = options;
    }

    public add(amount: number): Currency {
        if (amount < 0) return this.sub(-amount);

        const added = this.#amount + amount;

        if (!Number.isSafeInteger(added)) {
            this.#amount = Currency.MAX;
        } else {
            this.#amount = added;
        }

        return this;
    }

    public sub(amount: number): Currency {
        if (amount < 0) return this.add(-amount);

        const sub = this.#amount - amount;

        if (!this.#options.allowNegative && sub < 0) {
            this.#amount = 0;
        } else {
            this.#amount = sub;
        }

        return this;
    }

    public mul(amount: number): Currency {
        const mult = this.#amount * amount;

        if (!this.#options.allowNegative && mult < 0) {
            this.#amount = 0;
        } else if (!Number.isSafeInteger(mult)) {
            this.#amount = Currency.MAX;
        } else {
            this.#amount = mult;
        }

        return this;
    }

    public div(amount: number): Currency {
        if (amount === 0) return this.mul(amount); // 1 / 0 === Infinity

        const div = this.#amount / amount;
        
        if (!this.#options.allowNegative && div < 0) {
            this.#amount = 0;
        } else {
            this.#amount = div;
        }

        return this;
    }
}
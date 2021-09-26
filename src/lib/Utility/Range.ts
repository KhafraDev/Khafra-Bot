class Ranger {
    constructor (
        public min = -Number.MAX_SAFE_INTEGER,
        public max = Number.MAX_SAFE_INTEGER, 
        public inclusive = false
    ) {
        if (
            typeof min !== 'number' || typeof max !== 'number'
            || Number.isNaN(min) || Number.isNaN(max) // neither is NaN
            || min >= max // max is greater than min
        )
            throw new TypeError('Range values must both be valid numbers!');

        this.min = min;
        this.max = max;
        this.inclusive = inclusive;
    }

    isInRange (v: number) {
        return (
            typeof v === 'number' && !Number.isNaN(v) // number + NaN check
            && (
                // if inclusive, check if in range [min, max]
                (this.inclusive && v >= this.min && v <= this.max) ||
                // else, check if in range (min, max)
                (!this.inclusive && v > this.min && v < this.max)
            )
        );
    }
}

export const Range = (min: number, max: number, inclusive?: boolean) => new Ranger(min, max, inclusive);
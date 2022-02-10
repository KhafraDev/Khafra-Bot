const timeUnits = {
    w: { unit: 'w', amount: 1000 * 60 * 60 * 24 * 7 },
    d: { unit: 'd', amount: 1000 * 60 * 60 * 24 },
    h: { unit: 'h', amount: 1000 * 60 * 60 },
    m: { unit: 'm', amount: 1000 * 60 },
    s: { unit: 's', amount: 1000 },
    ms: { unit: 'ms', amount: 1e-3 }
} as const;

const wsRegex = '[ \\t]';
const positiveNumberRegex = '(?:0|[1-9]\\d*)(?:\\.\\d+)?';
const unitRegex = '(?:ms|s|m|h|d|w)';
const elementRegex = `(?:(${positiveNumberRegex})${wsRegex}*(${unitRegex}))`;
const wholeRegex = `^${wsRegex}*(-)?((?:${wsRegex}*${elementRegex}${wsRegex}*)+)$`;

const re = new RegExp(elementRegex, 'g');
const whole = new RegExp(wholeRegex);

/**
 * parse human readable string to ms
 * 
 * initial implementation: https://github.com/nicolas-van/simple-duration
 * @license https://github.com/nicolas-van/simple-duration/blob/468ed595cdaf83d65a743c1dc9a3f2a333fe8e24/LICENSE.md
 * 
 * changes: seconds -> ms, remove times shorter than ms, added weeks (w), removed year
 */
export const parseStrToMs = (str: string): number | null => {
    const match = whole.exec(str);
    if (!match) return null;

    const elements = match[2];

    let nmatch: RegExpExecArray | null = null,
        counter = 0;

    while ((nmatch = re.exec(elements)) !== null) {
        const nbr = parseFloat(nmatch[1]);
        const unit = nmatch[2] as keyof typeof timeUnits;
        counter += nbr * timeUnits[unit].amount;
    }

    return Math.abs(counter);
}
type Value = true | string | string[];

export class Minimalist extends Map<string, Value> {
    constructor(s: string) {
        super();

        this.parse(s);
    }

    parse(s: string) {
        const tokens = s.split(/\s+/g);

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const toSlice = token[0] === '-' && token[1] === '-' ? 2 : 1;

            if (token.charAt(0) !== '-') continue;

            if (token.includes('=')) { // --prop=value
                const [n, value] = token.split('=', 2);
                super.set(n.slice(toSlice), value);
            } else if (tokens[i + 1] === undefined || tokens[i + 1].charAt(0) === '-') { // --prop --prop2
                super.set(token.slice(toSlice), true);
            } else { // --prop value
                const value: string[] = [];

                for (let j = i + 1; j < tokens.length; j++) {
                    const token = tokens[j];
                    if (token.startsWith('-')) break; // next option

                    value.push(token);
                }
                
                super.set(token.slice(toSlice), value.length === 1 ? value[0] : value);
            }
        }
    }
}

type Value = true | string;

export class Minimalist extends Map<string, Value> {
    private parsed = false;

    public constructor (public content: string) {
        super();
        this.content = content;
    }

    override has (k: string) {
        if (!this.parsed) this.parse();

        return super.has(k);
    }

    override get (k: string) {
        if (!this.parsed) this.parse();

        return super.get(k);
    }

    private parse (s = this.content) {
        this.parsed ||= true;
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
                
                super.set(token.slice(toSlice), value.join(' '));
            }
        }
    }
}

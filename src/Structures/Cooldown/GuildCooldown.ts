export class GuildCooldown {
    cache: Map<string, Record<string, number>> = new Map();
    MAX: number;
    formatted: string;

    constructor(MAX = 15) {
        this.MAX = MAX;

        const date = new Date();
        this.formatted = `${date.getMonth()+1}${date.getDate()}${date.getFullYear()}-${date.getHours()}${date.getMinutes()}`; // '8292020-2216'

        setTimeout(() => {
            setInterval(() => this.autoclear(), 60000);
        }, (60 - new Date().getSeconds()) * 1000); // wait until the next minute to set interval
    }

    set(id: string) {
        const guild = this.cache.get(id);

        this.cache.set(
            id,
            { [this.formatted]: (guild?.[this.formatted] ?? 0) + 1 }
        );
        
        return this;
    }

    limited(id: string) {
        return this.cache.get(id)?.[this.formatted] > this.MAX;
    }

    autoclear() {
        const date = new Date();
        this.formatted = `${date.getMonth()+1}${date.getDate()}${date.getFullYear()}-${date.getHours()}${date.getMinutes()}`; // '8292020-2216'

        for(const [id, value] of Array.from(this.cache.entries())) {
            const temp = { [this.formatted]: value[this.formatted] ?? 0 };
            this.cache.delete(id);
            this.cache.set(id, temp);
        }
    }
}
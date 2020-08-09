class Cooldown {
    cache: Map<string, {
        id: string,
        seconds: number,
        time: number
    }[]> = new Map();

    set(id: string, name: string, seconds: number) {
        const hold = this.cache.get(name);
        if(hold) {
            this.cache.set(name, hold.concat({
                id: id,
                seconds: seconds,
                time: Date.now()
            }));
        } else {
            this.cache.set(name, [
                {
                    id: id,
                    seconds: seconds,
                    time: Date.now()  
                }
            ])
        }

        this.delete(name, id, seconds);
    }

    /**
     * Get cooldowns for a specific command.
     * @param name command name to get cooldowns for
     */
    get(name: string) {
        return this.cache.get(name);
    }

    /**
     * Test if a user has a cooldown for a command already
     * @param name command name
     * @param id User id
     */
    has(name: string, id: string) {
        return this.get(name)?.filter(p => p.id === id).pop() ?? false;
    }

    delete(name: string, id: string, seconds: number) {
        setTimeout(() => {
            const hold = this.has(name, id);
            if(hold) {
                const filtered = this.get(name).filter(p => p.id !== id);
                this.cache.set(name, filtered);
            }
        }, seconds * 1000);
    }
}

export { Cooldown };
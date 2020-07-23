// cooldown.has(id, 'command name');

import { Snowflake } from "discord.js";

class Cooldown extends Map<Snowflake, string[]> {
    $set(id: Snowflake, name: string, seconds: number) {
        if(this.$has(id, name)) { // cooldown for id has command in array
            return this;
        }

        const get = this.get(id);
        if(!get) { // non-existent user, either deleter or first command
            this.set(id, [ name ]);
        } else { // if they do exist, add the command name to their cooldowns
            get.push(name);
        }

        // set timeout to remove command from cooldown array
        // or delete the entry if the user has no cooldowns
        this.$clear(id, name, seconds);
        return this;
    }

    $has(id: Snowflake, name: string) {
        const get = this.get(id);
        return get?.indexOf?.(name) > -1;
    }

    $clear(id: Snowflake, name: string, seconds: number) {
        setTimeout(() => {
            const get = this.get(id);
            const index = get.indexOf(name);
            if(index !== -1) {
                get.splice(index, 1);
            }

            if(get.length === 0) {
                this.delete(id);
            }
        }, seconds * 1000);
    }
}

export default new Cooldown();
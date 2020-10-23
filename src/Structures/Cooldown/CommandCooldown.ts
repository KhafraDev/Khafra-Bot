/**
 * 
 * @param max Max uses allows in ``ms`` milliseconds
 * @param ms How long cooldown applies for
 */
export const cooldown = (max: number, ms: number) => {
    const m = new Map();

    return (id: string) => {
        if(!m.has(id)) {
            m.set(id, [Date.now()]);
            return true;
        } else {
            const i = m.get(id);
            if(i.length >= max) {
                if(Date.now() - i > ms) {
                    m.set(id, i.slice(1));
                    return true;
                }

                return false;
            } else {
                m.set(id, [...i, Date.now()]);
                return true;
            }
        }
    }
}
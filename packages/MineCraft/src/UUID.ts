import { fetch } from 'undici';
import type { UsernameUUID } from '..';

const base = 'https://api.mojang.com/users/profiles/minecraft/' as const;

export const UUID = async (username: string): Promise<UsernameUUID | null> => {
    const r = await fetch(`${base}${username}`);

    // Username does not exist
    if (r.status === 204) {
        return null;
    }

    return await r.json() as UsernameUUID;
}
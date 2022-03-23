import { fetch } from 'undici';
import type { NameHistory } from '..';

const base = 'https://api.mojang.com/user/profiles/' as const;

export const getNameHistory = async (uuid: string): Promise<NameHistory> => {
    const r = await fetch(`${base}${uuid}/names`);
    return await r.json() as NameHistory;
}
import { fetch } from 'undici';
import { getProfile } from './Profile.js';

const optifineBase = 'http://s.optifine.net/capes/' as const;

export const getCapes = (uuid: string): Promise<string[]> => getProfile(uuid, 'CAPE');

export const getOptifineCape = async (username: string): Promise<ArrayBuffer | null> => {
    const r = await fetch(`${optifineBase}${username}.png`);

    if (r.status !== 200) {
        return null;
    }

    return await r.arrayBuffer();
}
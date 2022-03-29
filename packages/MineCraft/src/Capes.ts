import { request } from 'undici';
import { getProfile } from './Profile.js';

const optifineBase = 'http://s.optifine.net/capes/' as const;

export const getCapes = (uuid: string): Promise<string[]> => getProfile(uuid, 'CAPE');

export const getOptifineCape = async (username: string): Promise<ArrayBuffer | null> => {
    const { body, statusCode } = await request(`${optifineBase}${username}.png`);

    if (statusCode !== 200) {
        return null;
    }

    return body.arrayBuffer();
}
import { getProfile } from './Profile.js';

export const getSkin = (uuid: string): Promise<string[]> => getProfile(uuid, 'SKIN');
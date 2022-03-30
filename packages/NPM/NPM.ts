import { request } from 'undici';
import type { INPMPackage } from './types/NPM';

export const npm = async (packageName: string): Promise<INPMPackage> => {
    const name = encodeURIComponent(packageName);
    const { body } = await request('https://registry.npmjs.com/' + name);

    return body.json() as Promise<INPMPackage>;
}
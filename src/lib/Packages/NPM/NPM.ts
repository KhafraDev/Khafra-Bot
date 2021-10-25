import { fetch } from 'undici';
import { INPMPackage } from './types/NPM';

export const npm = async (package_name: string): Promise<INPMPackage> => {
    const res = await fetch('https://registry.npmjs.com/' + encodeURIComponent(package_name));
    return await res.json() as INPMPackage;
}
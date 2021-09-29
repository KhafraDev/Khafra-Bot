import { fetch } from 'undici';
import { INPMPackage } from './types/NPM';

export const npm = async (package_name: string) => {
    try {
        const res = await fetch('https://registry.npmjs.com/' + encodeURIComponent(package_name));
        const json = await res.json() as INPMPackage;
        return json;
    } catch(e) {
        return Promise.reject(e);
    }
}
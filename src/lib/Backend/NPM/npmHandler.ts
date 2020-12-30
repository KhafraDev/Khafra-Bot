import fetch from 'node-fetch';
import { INPMPackage } from './types/npm';

export const npm = async (package_name: string) => {
    try {
        const res = await fetch('https://registry.npmjs.com/' + encodeURIComponent(package_name));
        const json = await res.json() as INPMPackage;
        return json;
    } catch(e) {
        return Promise.reject(e);
    }
}
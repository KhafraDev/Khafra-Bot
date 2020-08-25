import fetch from "node-fetch";
import { INPMPackage } from "./types/npm";

export const npm = (package_name: string) => {
    return fetch('https://registry.npmjs.com/' + encodeURIComponent(package_name))
        .then(res => res.json() as Promise<INPMPackage>);
}
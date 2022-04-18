import type { INPMPackage } from './types/NPM';
export declare const npm: (packageName: string) => Promise<INPMPackage>;

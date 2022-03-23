import { join } from 'path';
import { cwd as processCwd } from 'process';

export const cwd = processCwd();
export const assets = (...args: string[]): string => join(cwd, 'assets', ...args);
export const Json = (...args: string[]): string => assets('JSON', ...args);
export const fonts = (...args: string[]): string => assets('Fonts', ...args);
export const templates = (...args: string[]): string => assets('Templates', ...args);
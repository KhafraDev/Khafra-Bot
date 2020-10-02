import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export default function loadEnv() {
    const path = join(process.cwd(), '.env');
    if(!existsSync(path)) {
       throw new Error('.env: No .env file found at the root of the repo!');
    }

    const buffer = readFileSync(path, { encoding: 'utf-8' }).split(/\n\r|\n|\r/g);
    for(const line of buffer) {
        const [env, val] = line.trim().split('=');
        Object.defineProperty(process.env, env, {
            value: val
        });
    }
}
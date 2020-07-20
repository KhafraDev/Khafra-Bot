import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { EOL } from 'os';

export default function loadEnv() {
    const path = join(process.cwd(), '.env');
    if(!existsSync(path)) {
       throw new Error('.env: No .env file found at the root of the repo!');
    }

    const buffer = readFileSync(path).toString().split(EOL);
    for(const line of buffer) {
        const [env, val] = line.split('=');
        Object.defineProperty(process.env, env, {
            value: val
        });
    }
}
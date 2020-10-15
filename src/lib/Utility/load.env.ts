import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs'; // sync is bad except for checking file existence 

export const loadEnv = async () => {
    const path = join(process.cwd(), '.env');
    if(!existsSync(path)) {
       throw new Error('.env: No .env file found at the root of the repo!');
    }

    const file = (await readFile(path, { encoding: 'utf-8' })).split(/\r\n|\n/g);
    const kvPair = Object.assign({}, ...file.map(e => {
        const [k, v] = e.split('=');
        return { [k]: v };
    }));

    // keys aren't assigned to the process.env object
    // which means env variables set by user aren't enumerable
    process.env = new Proxy(process.env, {
        get: (_ /* process.env */, p /* prop */) => {
            return p in kvPair ? kvPair[p] : undefined;
        }
    });

    for(const key in process.env) {
        if(key in kvPair) {
            throw new Error(`${key} was assigned to process.env!`);
        }
    }
}
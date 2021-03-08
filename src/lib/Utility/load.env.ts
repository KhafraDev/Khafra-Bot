import { join } from 'path';
import { existsSync, readFileSync } from 'fs';

type Env = { [key: string]: string };

const path = join(process.cwd(), '.env');
if (!existsSync(path)) {
    throw new Error('.env: No .env file found at the root of the repo!');
}

const file = readFileSync(path, 'utf-8').split(/\r\n|\n/g);
const kvPair: Env = Object.assign({}, ...file.map(e => {
    const [k, ...v] = e.split('=');
    return { [k]: v.join('=') };
}));

// keys aren't assigned to the process.env object
// which means env variables set by user aren't enumerable
process.env = new Proxy(process.env, {
    get: (env /* process.env */, p: string /* prop */) => {
        return p in kvPair ? kvPair[p] : env[p];
    }
});
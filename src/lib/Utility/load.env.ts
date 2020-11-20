import { join } from 'path';
import { existsSync, readFileSync } from 'fs';

const path = join(process.cwd(), '.env');
if(!existsSync(path)) {
    throw new Error('.env: No .env file found at the root of the repo!');
}

const file = readFileSync(path, 'utf-8').split(/\r\n|\n/g);
const kvPair = Object.assign({}, ...file.map(e => {
    const [k, ...v] = e.split('=');
    return { [k]: v.join('=') };
}));

// keys aren't assigned to the process.env object
// which means env variables set by user aren't enumerable
process.env = new Proxy(process.env, {
    get: (env /* process.env */, p /* prop */) => {
        // https://github.com/microsoft/TypeScript/pull/26797
        // https://github.com/microsoft/TypeScript/issues/1863
        return p in kvPair ? kvPair[p] : env[p as any];
    }
});
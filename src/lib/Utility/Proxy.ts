const auth = 'Basic ' + Buffer.from(
    process.env.PROXY_USERNAME + ':' + process.env.PROXY_PASSWORD
).toString('base64');

import { parse } from 'url';
import HttpsProxyAgent from 'https-proxy-agent';

const opts = Object.assign(
    parse('http://us5082.nordvpn.com'),
    { headers: { 'Proxy-Authorization': auth } }
);

const proxy = new (HttpsProxyAgent as any)(opts);

export { proxy as agent };
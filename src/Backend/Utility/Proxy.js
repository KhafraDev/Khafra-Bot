const auth = 'Basic ' + Buffer.from(
    process.env.PROXY_USERNAME + ':' + process.env.PROXY_PASSWORD
).toString('base64');

const { parse } = require('url');
const HttpsProxyAgent = require('https-proxy-agent');

const proxy = new HttpsProxyAgent(Object.assign(
    parse('http://us5082.nordvpn.com'),
    { headers: { 'Proxy-Authorization': auth } }
));

module.exports.agent = proxy;
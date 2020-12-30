const getEnv = () => {
    const {
        __KONG_USERNAME,
        __KONG_PASSWORD,
        __KONG_WEBHOOK
    } = process.env;
    return { __KONG_USERNAME, __KONG_PASSWORD, __KONG_WEBHOOK }
}

import ws from 'ws';
import parse5, {
    DefaultTreeParentNode as DTPN,
    DefaultTreeElement as DTE,
    DefaultTreeTextNode as DTTN
} from 'parse5';
import { URL } from 'url';
import { MessageEmbed } from 'discord.js';
import fetch from 'node-fetch';
import { trim } from '../Utility/Template.js';

export const userCache = new Map<string, string>();

const hold = Array<{ text: string, from: string }>();
const game = Buffer.from(JSON.stringify({
    game_id: 320578,
    permalink: 'synergism',
    game_name: 'Synergism'
})).toString('base64');
let room = 2;

const NS = {
    CLIENT: 'jabber:client',
    AUTH: 'jabber:iq:auth',
    MUC: 'http://jabber.org/protocol/muc',
    SASL: 'urn:ietf:params:xml:ns:xmpp-sasl',
    STREAM: 'http://etherx.jabber.org/streams',
    FRAMING: 'urn:ietf:params:xml:ns:xmpp-framing',
    BIND: 'urn:ietf:params:xml:ns:xmpp-bind',
    SESSION: 'urn:ietf:params:xml:ns:xmpp-session',
    VERSION: 'jabber:iq:version'
}

/**
 * generates a valid SVID (in holodeck.js, getUniqueID). 
 */
const svid = (a?: string) => { 
    const b = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, m => {
        const c = 16 * Math.random() | 0;
        return ('x' === m ? c : c & 3 | 8).toString(16);
    });
    
    return typeof a === 'string' || typeof a === 'number' ? b + ':' + a : b;
}

const WebSocket = new ws(`wss://chat-proxy.kongregate.com/?sid=${svid()}&svid=${svid()}&wsr=false&wss=false&ca=0&wc=0&bc=0&tc=0&sr=0&ss=0&pb=true`);

WebSocket.on('open', () => {
    WebSocket.send(`<open xmlns="${NS.FRAMING}" to="of1.kongregate.com" version="1.0"/>`);
});

let sentFirstStreamFeature = false;

WebSocket.on('message', (m: string) => {   
    const part = parse5.parseFragment(m) as DTPN;
    const node = part.childNodes[0] as DTE;
    const { __KONG_USERNAME: username, __KONG_PASSWORD: password } = getEnv();

    if(!node) {
        return;
    }
    
    if( // m.startsWith(`<stream:features xmlns:stream="${NS.STREAM}"`)
        node.nodeName === 'stream:features' && 
        node.attrs.some(a => a.name === 'xmlns:stream' && a.value === NS.STREAM)
    ) {
        if(!sentFirstStreamFeature) {
            sentFirstStreamFeature = true;
            const auth = `${username.toLowerCase()}@of1.kongregate.com\x00${username.toLowerCase()}\x00{"k":"${password}"}`;
            WebSocket.send(`<auth xmlns='${NS.SASL}' mechanism='PLAIN'>${Buffer.from(auth).toString('base64')}</auth>`);
        } else {
            WebSocket.send(`<iq type='set' id='_bind_auth_2' xmlns='${NS.CLIENT}'><bind xmlns='${NS.BIND}'><resource>xiff</resource></bind></iq>`)
        }
    } else if( // m.startsWith(`<success xmlns="${NS.SASL}"`)
        node.nodeName === 'success' && 
        node.attrs.some(a => a.name === 'xmlns' && a.value === NS.SASL)
    ) {
        WebSocket.send(`<open xmlns="${NS.FRAMING}" to="of1.kongregate.com" version="1.0"/>`);
    } else if( // m.startsWith('<iq type="result"')
        node.nodeName === 'iq' && 
        node.attrs.some(a => a.name === 'type' && a.value === 'result')
    ) {
        if(node.attrs.some(a => a.name === 'id' && a.value === '_bind_auth_2')) { // m.includes(`<jid>${username.toLowerCase()}`)
            WebSocket.send(`<iq type='set' id='_session_auth_2' xmlns='${NS.CLIENT}'><session xmlns='${NS.SESSION}'/></iq>`);
        } else if(node.attrs.some(a => a.name === 'id' && a.value === '_session_auth_2')) {
            WebSocket.send(`<presence xmlns='${NS.CLIENT}'><show>chat</show></presence>`);
            WebSocket.send('');
            WebSocket.send(`<iq type='get' id='${svid('ping')}' xmlns='${NS.CLIENT}'><ping xmlns='urn:xmpp:ping'/></iq>`);
            
            setInterval(() => {
                WebSocket.send('');
                WebSocket.send(`<iq type='get' id='${svid('ping')}' xmlns='${NS.CLIENT}'><ping xmlns='urn:xmpp:ping'/></iq>`);
            }, 30000);

            WebSocket.send(`<iq type='get' id='${svid()}' xmlns='${NS.CLIENT}'><query xmlns='kongregate:iq:msg'><msg opcode='room.rq'>${game}</msg></query></iq>`);
        } else if(node.attrs.some(a => a.name === 'from' && a.value === 'admin@of1.kongregate.com/server')) { // m.includes(`from="admin@of1.kongregate.com/server"`)
            WebSocket.send(`<presence from='${username.toLowerCase()}@of1.kongregate.com/xiff' to='320578-synergism-2@conference.of1.kongregate.com/${username}' xmlns='${NS.CLIENT}'><x xmlns='${NS.MUC}'><history seconds='60'/></x><status>[&quot;null&quot;,&quot;[]&quot;,{}]</status></presence>`);
        }
    } else {
        const frag = parse5.parseFragment(m) as DTPN;
        if(!frag.childNodes?.[0]?.nodeName) {
            return;
        } else if(frag.childNodes[0].nodeName === 'presence') {
            if((frag.childNodes[0] as DTE).attrs.some(a => a.name === 'from')) {
                const from = (((frag.childNodes[0] as DTPN)?.childNodes?.[0] as DTPN)?.childNodes?.[0] as DTTN).value;
                if(!from) {
                    return;
                }

                const data = from.match(/,"\[(.*?)\]",/);
                if(!data?.[1]) {
                    return;
                }

                let user: string, avatarURL: URL;
                try {
                    const [username,,,partialAvatar]: string[] = JSON.parse(`[${data[1].replace(/\\/g, '')}]`);
                    avatarURL = new URL(partialAvatar.replace(/cdn(\d):/, (_, b) => `https://cdn${b}.kongcdn.com`));
                    user = username;
                } catch {
                    return;
                }

                if(typeof user !== 'string') {
                    return;
                }

                if(!userCache.has(user)) {
                    userCache.set(user, avatarURL.href);
                }
            } 
        } else if(frag.childNodes[0].nodeName === 'message') {
            const text = ((frag.childNodes[0] as DTE).childNodes as DTTN[]).filter(t => t.nodeName === '#text').shift()?.value;
            const from = (frag.childNodes[0] as DTE).attrs.filter(a => a.name === 'from')?.shift().value.split('/').pop();
            if(typeof text === 'string') {                
                const valid = text.split(/\s+/g).every(e => { // if any urls are presents, don't send text
                    try {
                        new URL(e);
                        return false;
                    } catch {
                        return true;
                    }
                });
                if(valid) {
                    hold.push({ text, from });
                }
            }
        }
    }
});

const handleMessage = async () => {    
    const { __KONG_WEBHOOK } = getEnv();
    if(!__KONG_WEBHOOK) {
        return;
    } else if(hold.length === 0) {
        return;
    }

    const embeds = Array<MessageEmbed>();
    const messages = hold.splice(0, 10);
    
    for(const { text, from } of messages) {
        const user = userCache.get(from);
        const embed = new MessageEmbed()
            .setColor('#ffe449')

        if(/^:sticker-\d+-(.*?):/.test(text)) {
            try {
                const image = JSON.parse(text.replace(/^:sticker-\d+-(.*?):/, ''));
                embed.setDescription(`${from} - sticker from ${image.stickerPackName}`);
                embed.setImage(`https://cdn1.kongcdn.com/assets/dynamic/stickers/${image.stickerId}/${image.stickerVariant}.png?width=72`);
            } catch {
                embed.setDescription(`${from} - ${text}`);
            }
        } else {
            embed.setDescription(`${from} - ${text}`);
        }

        if(typeof user !== 'undefined') {
            embed.setThumbnail(user);
        }

        embeds.push(embed);
    }

    try {
        await fetch(__KONG_WEBHOOK, { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ embeds })
        });
    } catch {}
}

export const changeRooms = (newRoom = 3) => {
    const { __KONG_USERNAME: username } = getEnv();

    const leave = trim`
    <presence 
        type='unavailable' 
        id='${svid()}' 
        from='${username}@of1.kongregate.com/xiff' 
        to='320578-synergism-${room}@conference.of1.kongregate.com/${username}' xmlns='${NS.CLIENT}'
    >
        <status/>
    </presence>
    `;
    const join = trim`
    <presence 
        from='${username}@of1.kongregate.com/xiff' 
        to='320578-synergism-${newRoom}@conference.of1.kongregate.com/${username}' 
        xmlns='${NS.CLIENT}'
    >
        <x xmlns='${NS.MUC}'>
            <history seconds='60'/>
        </x>
        <status>
            [&quot;null&quot;,&quot;[\&quot;${username}\&quot;,\&quot;\&quot;,1,\&quot;cdn4:/assets/avatars/defaults/slimyghost.png?i10c=img.resize(width:16)\&quot;,\&quot;Synergism\&quot;,\&quot;/games/Platonic/synergism\&quot;,[],[]]&quot;,{&quot;special_chat_vars&quot;:&quot;{}&quot;}]
        </status>
    </presence>
    `;

    WebSocket.send(leave);
    WebSocket.send(join);
    return true;
}

setInterval(() => handleMessage(), 15000);
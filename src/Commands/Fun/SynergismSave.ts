import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import Embed from "../../Structures/Embed";
import { URL } from "url";
import fetch from "node-fetch";

export default class extends Command {
    constructor() {
        super(
            [
                'Get stats on a Synergism save!',
                '[file]'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'synergism',
                folder: 'Fun',
                cooldown: 5,
                aliases: [ 'synergismsave', 'kiara' ]
            }
        );
    }

    async init(message: Message) {
        if(message.attachments.size === 0) {
            return message.channel.send(Embed.missing_args.call(this, 0));
        }

        const file = message.attachments.first();
        if(file.size > 1e6) { // 1MB
            return message.channel.send(Embed.success(`
            Are you really sure a Synergism save file is ${file.size.toLocaleString()} bytes?
            `));
        }

        const url = new URL(file.url);
        if(url.host !== 'cdn.discordapp.com' || !url.href.endsWith('.txt')) {
            return message.channel.send(Embed.fail(`
            File either isn't from Discord is isn't a .txt file!
            `));
        }

        let res: string;
        try {
            const download = await fetch(url);
            if(download.ok) {
                res = await download.text(); 
            } 
        } catch {
            return message.channel.send(Embed.fail(`
            An unexpected error occurred!
            `));
        } 

        if(!res) {
            return message.channel.send(Embed.fail(`
            File couldn't be downloaded!
            `));
        } else if(res.indexOf('N') === 0) {
            return message.channel.send(Embed.fail(`
            Command doesn't work on old saves that use LZString!
            `));
        }
        
        let parsed: { coins: string; worlds: number; maxofferings: number; prestigePoints: string; transcendPoints: string; transcendShards: string; reincarnationPoints: string; researchPoints: number; };
        try {
            parsed = JSON.parse(Buffer.from(res, 'base64').toString())
        } catch {
            return message.channel.send(Embed.fail(`
            An error occurred decoding the save file!
            `));
        }

        const embed = Embed.success()
            .addField('**Coins:**', parsed.coins, true)
            .addField('**Quarks:**', parsed.worlds.toLocaleString(), true)
            .addField('**Offerings:**', parsed.maxofferings.toLocaleString(), true)
            .addField('**Diamonds:**', parsed.prestigePoints, true)
            .addField('**Mythos:**', parsed.transcendPoints, true)
            .addField('**Mythos Shards:**', parsed.transcendShards, true)
            .addField('**Particles:**', parsed.reincarnationPoints, true)
            .addField('**Obtainium:**', parsed.researchPoints.toLocaleString(), true)
            .addField('**Size:**', (file.size / 1000).toLocaleString() + ' KB', true);

        return message.channel.send(embed);
    }
}
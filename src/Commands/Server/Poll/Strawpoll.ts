import { Command } from "../../../Structures/Command.js";
import { Message } from "discord.js";
import { stripIndents } from "../../../lib/Utility/Template.js";
import fetch, { Response } from "node-fetch";

const isYesLike = (s: string) => ['1', 'yes', 'y', 'true'].includes(s.toLowerCase()) ? 1 : 0;

export default class extends Command {
    constructor() {
        super(
            [
                'Create a Strawpoll!', 
                ''
            ],
            [ 'ADD_REACTIONS' ],
            {
                name: 'strawpoll',
                aliases: [ 'createstrawpoll', 'newstrawpoll' ],
                folder: 'Server',
                args: [0, 0],
                guildOnly: true
            }
        );
    }

    async init(message: Message) {
        if((!super.hasPermissions(message) || !super.userHasPerms(message, [ 'ADMINISTRATOR' ]))
            && !this.isBotOwner(message.author.id)
        ) {
            return message.channel.send(this.Embed.missing_perms(true));
        }

        const msg = await message.channel.send(this.Embed.success(`
        Welcome to the Strawpoll creator. Due to the number of configurable options, this is a lengthy process.

        To start off, enter the \`\`title\`\` of the poll and the \`\`answers\`\`, all on different lines (press \`\`Shift+Enter\`\` to go to a new line).
        An example is as follows:
        \`\`\`${stripIndents`
        What is your favorite fruit?
        🍎 - Apples
        🍌 - Bananas
        🍇 - Grapes
        something else
        `}\`\`\`
        `));

        if(!msg) {
            return; // can return null if an error is caught
        }

        const filter = (m: Message) => m.author.id === message.author.id && m.content?.split(/\r\n|\n/g).length > 1;
        const collected = await message.channel.awaitMessages(filter, { max: 1, time: 60000 });
        if(collected.size === 0) {
            return;
        }

        const opts: Record<string, number | string | Date> = {
            priv: 1, // state
            ma: 0, // multiple answers
            mip: 0, // multiple votes per ip
            co: 1, // comments
            vpn: 0, // vpns can vote
            enter_name: 0, // voters must enter name
            only_reg: 0, // only registered users
            captcha: 0, // captcha
        };

        const [title, ...choices] = collected.first().content.split(/\r\n|\n/g);
        await msg.edit(this.Embed.success(`
        Got a title and ${choices.length} answers. Let's configure options now.

        Enter a \`\`1\`\` to enable an option and \`\`0\`\` to disable an option.
        Some fields may differ in how to change its value, make sure to read each option!

        To continue, enter each choice separated by a space, as shown below:
        Invalid options will be set to a default value!
        \`\`\`1 0 0 0 1 0 0 0\`\`\`
        This would create a \`\`private\`\` poll where only 1 answer is allowed per IP, no comments allowed, anonymous voting, no captchas, and would end in 10 days.
        `).addFields(
            { name: '**State**',                 value: '1 - Private, 0 - Public',       inline: true },
            { name: '**Multiple Answers:**',     value: 'Allow multiple answers.',       inline: true },
            { name: '**Multiple Votes Per IP**', value: 'Allow multiple votes per IP.',  inline: true },
            { name: '**Comments:**',             value: 'Allow comments.',               inline: true },
            { name: '**VPN:**',                  value: 'Allow people on VPNs to vote.', inline: true },
            { name: '**Enter Name:**',           value: 'Voters must enter their name.', inline: true },
            { name: '**Registered:**',           value: 'Only allow registered users.',  inline: true },
            { name: '**Captcha:**',              value: 'Background reCAPTCHA solving.', inline: true },
        ));

        const filterOpts = (m: Message) => m.author.id === message.author.id && m.content?.length <= 16;
        const collectedOpts = await message.channel.awaitMessages(filterOpts, { max: 1, time: 60000 });
        if(collectedOpts.size === 0) {
            return;
        }

        const opt = collectedOpts.first().content.split(/\s+/g).map(isYesLike);
        const keys = Object.keys(opts);
        for(let i = 0; i < keys.length; i++) {
            opts[keys[i]] = Number(opt[i] ?? 0);
        }
     
        const res: Response = await fetch('https://strawpoll.com/api/poll', {
            method: 'POST',
            body: JSON.stringify({
                poll: {
                    title,
                    answers: choices,
                    ...opts
                }
            })
        });

        if(!res.ok) {
            return message.channel.send(this.Embed.fail(`
            An unexpected error occurred! Received status ${res.status} (${res.statusText})!
            `));
        }

        const json = await res.json();
        await msg.edit(this.Embed.success(`
        ${json.success === 1 ? `https://strawpoll.com/${json.content_id}` : 'An error occurred!'}
        `));

        if(json.success === 1) {
            return message.author.send(this.Embed.success(`
            Created a poll: https://strawpoll.com/${json.content_id}

            Admin ID: \`\`${json.admin_key}\`\`
            `))
                .catch(() => {});
        }
    }
}
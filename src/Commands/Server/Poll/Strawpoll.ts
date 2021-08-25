import { Command } from '../../../Structures/Command.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { Components, disableAll } from '../../../lib/Utility/Constants/Components.js';
import { Message, MessageActionRow } from 'discord.js';
import { once } from 'events';
import { fetch } from 'undici';
import { dontThrow } from '../../../lib/Utility/Don\'tThrow.js';


interface StrawpollOptions {
    priv: boolean
    co: boolean
    ma: boolean
    mip: boolean
    enter_name: boolean
    deadline: Date | undefined
    only_reg: boolean
    vpn: boolean
    captcha: boolean
}

const yes = (yes: boolean, ifYes = 'Yes', ifNo = 'No') =>
    yes ? ifYes : ifNo;

const hasOwn = Object.prototype.hasOwnProperty;

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Create a Strawpoll!'
            ],
			{
                name: 'strawpoll',
                aliases: [ 'createstrawpoll' ],
                folder: 'Server',
                args: [0, 0],
                ratelimit: 300,
                guildOnly: true
            }
        );
    }

    async init(message: Message) {
        const defaultOpts: StrawpollOptions = {
            priv: true, ///false - Private or public
            co: true, ///false - Allow Comments
            ma: false, // - Multiple Answers allowed
            mip: false, // - Multiple votes per IP allowed
            enter_name: false, // - Voters have to enter their name (still in development)
            deadline: undefined, // - Specific datetime of deadline in zulu time
            only_reg: false, // - Allow only registered users to vote
            vpn: false, //- Allow VPN users to vote
            captcha: true //- Background reCAPTCHA solving
        }

        const rows = [
            new MessageActionRow().addComponents(
                Components.approve('Public', 'priv'),
                Components.primary('Comments', 'co'),
                Components.approve('Registered', 'only_reg'),
            ),
            new MessageActionRow().addComponents(
                Components.primary('Multiple', 'ma'),
                Components.approve('Allow VPN', 'vpn'),
                Components.primary('Captcha', 'captcha')
            ),
            new MessageActionRow().addComponents(
                Components.deny('Cancel', 'cancel'),
                Components.deny('Done', 'done')
            )
        ];

        const makeEmbed = () => {
            return this.Embed.success()
                .setTitle('Poll Configuration')
                .addFields(
                    { name: '**Private:**', value: yes(defaultOpts.priv), inline: true },
                    { name: '**Allow Comments:**', value: yes(defaultOpts.co), inline: true },
                    { name: '**Only Registered:**', value: yes(defaultOpts.only_reg), inline: true },
                    { name: '**Multiple Votes:**', value: yes(defaultOpts.ma), inline: true },
                    { name: '**Allow VPN Votes:**', value: yes(defaultOpts.vpn), inline: true },
                    { name: '**Captcha:**', value: yes(defaultOpts.captcha), inline: true }
                )
                .setDescription(`
                Click on the buttons below to enable or disable settings.

                Once you are done, click \`Done\` to start entering choices.
                `);
        }

        const m = await message.reply({
            embeds: [makeEmbed()],
            components: rows
        });

        const c = m.createMessageComponentCollector({
            filter: (i) => 
                i.user.id === message.author.id &&
                (hasOwn.call(defaultOpts, i.customId) || ['cancel', 'done'].includes(i.customId)),
            max: 12,
            time: 120_000
        });

        const status = await new Promise<'done' | null>(res => {
            c.on('collect', async (interaction) => {
                if (interaction.customId === 'cancel') {
                    await dontThrow(interaction.update({
                        embeds: [this.Embed.fail('Command was canceled!')],
                        components: disableAll(m)
                    }));

                    return res(null);
                } else if (interaction.customId === 'done') {
                    await dontThrow(interaction.update({
                        embeds: [
                            this.Embed.success()
                                .setTitle('Setting Choices')
                                .setDescription(`
                                Send an individual message for each choice, the title will be the first message you send.
                                `)
                        ],
                        components: []
                    }));

                    return res('done');
                } else {
                    if (interaction.customId === 'ma') {
                        defaultOpts['ma'] = !defaultOpts['ma'];
                        defaultOpts['mip'] = !defaultOpts['mip'];
                    } else {
                        const key = interaction.customId as keyof typeof defaultOpts;
                        (defaultOpts[key] as boolean) = !defaultOpts[key]; 
                    }

                    return void dontThrow(interaction.update({ embeds: [makeEmbed()] }));
                }
            });

            c.on('end', () => res(null));
        });

        if (status === null) return; // command was canceled or poll config wasn't finished

        const choices: string[] = [];
        
        const mc = m.channel.createMessageCollector({
            filter: (m) => 
                m.author.id === message.author.id &&
                m.content.length > 0,
            time: 240_000
        });

        mc.on('collect', (m: Message) => void choices.push(m.content));
        
        await once(mc, 'end');

        if (choices.length === 0) {
            return m.edit({
                embeds: [
                    this.Embed.fail('No answers were provided, canceling the poll creation!')
                ],
                components: []
            });
        }

        const r = await fetch('https://strawpoll.com/api/poll', {
            method: 'POST',
            body: JSON.stringify({
                poll: { 
                    title: choices[0], 
                    answers: choices.slice(1), 
                    ...defaultOpts 
                }
            })
        });

        const j = await r.json() as { admin_key: string, content_id: string, success: 1 | 0 };

        return m.edit({
            embeds: [
                this.Embed.success(`https://strawpoll.com/${j.content_id}`)
            ]
        });
    }
}
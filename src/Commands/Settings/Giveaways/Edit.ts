import { Arguments, Command } from '../../../Structures/Command.js';
import { pool } from '../../../Structures/Database/Postgres.js';
import { Giveaway } from '../../../lib/types/KhafraBot.js';
import { MessageActionRow, Message } from 'discord.js';
import { hyperlink, inlineCode, bold } from '@khaf/builders';
import { Components, disableAll, enableAll } from '../../../lib/Utility/Constants/Components.js';
import { parseStrToMs } from '../../../lib/Utility/ms.js';
import { Range } from '../../../lib/Utility/Valid/Number.js';
import { time } from '@khaf/builders';
import { dontThrow } from '../../../lib/Utility/Don\'tThrow.js';

type GiveawayRow = Pick<Giveaway, 'guildid' | 'messageid' | 'channelid' | 'initiator' | 'id' | 'enddate' | 'prize'>;
type GiveawayEdit = Pick<Giveaway, 'id'>;

// https://github.com/nodejs/node/blob/a518e4b871d39f0631beefc79cfa9dd81b82fe9f/test/parallel/test-crypto-randomuuid.js#L20
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const monthMs = 60 * 1000 * 60 * 24 * 30;
const winnersRange = Range({ min: 1, max: 100, inclusive: true });

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Giveaway: edit a giveaway that is ongoing.',
            ],
			{
                name: 'giveaway:edit',
                folder: 'Giveaways',
                aliases: ['giveaways:edit'],
                args: [0, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message<true>, { args }: Arguments) {
        if (args.length === 0 || (args.length === 1 && args[0].toLowerCase().endsWith('edit'))) {
            const { rows } = await pool.query<GiveawayRow, string[]>(`
                SELECT guildId, messageId, channelId, initiator, endDate, prize, id
                FROM kbGiveaways
                WHERE guildId = $1::text AND initiator = $2::text
                ORDER BY endDate ASC
                LIMIT 10;
            `, [message.guild.id, message.author.id]);
            
            let str = '';
            for (const row of rows) {
                const url = `https://discord.com/channels/${row.guildid}/${row.channelid}/${row.messageid}`;
                str +=
                    `ID: ${inlineCode(row.id)}: ${hyperlink('URL', url)} ` +
                    time(row.enddate) + ' ' +
                    // uuid = 36 chars long, discord message is ~85
                    inlineCode(row.prize.length > 50 ? `${row.prize.slice(0, 50)}...` : row.prize)
                    + '\n';
            }

            return this.Embed.ok(str)
                .setTitle('Your Current Giveaways');
        }

        // args can be one of
        // delete [id] [...args]
        // [id]
        const id = args.length === 1
            ? args[0]
            : args[1];

        if (!uuidRegex.test(id)) {
            return this.Embed.error('UUID is not formatted correctly, please use a valid ID next time!');
        }

        const m = await message.channel.send({
            embeds: [
                this.Embed.ok(`
                Some settings cannot be deleted. If you need to edit those settings, re-create the giveaway instead.

                ${bold('Which setting would you like to change?')}
                `)
            ],
            components: [
                new MessageActionRow().addComponents(
                    Components.approve('End Date', 'endDate'),
                    Components.primary('Prize', 'prize'),
                    Components.secondary('Winners', 'winners'),
                ),
                new MessageActionRow().addComponents(
                    Components.deny('Cancel', 'cancel'),
                    Components.deny('Save', 'save')
                )
            ]
        });

        let $ = 1;
        const sql: string[] = [];
        const params: unknown[] = [];

        const c = m.createMessageComponentCollector({
            max: 5,
            time: 300_000,
            filter: (interaction) =>
                interaction.user.id === message.author.id &&
                ['endDate', 'prize', 'winners', 'cancel', 'save'].includes(interaction.customId)
        });

        c.on('collect', async (i) => {
            if (i.customId === 'cancel') {
                return c.stop('cancel');
            } else if (i.customId === 'save') { 
                return c.stop('save');
            } else if (i.customId === 'endDate') {
                await dontThrow(i.update({
                    embeds: [
                        this.Embed.ok(`
                        ${bold('When should the giveaway end?')}
                    
                        Valid formats are similar but not limited to ${inlineCode(`1h 30m`)} and ${inlineCode(`2w 3d 1h`)}.
                        A giveaway must be at least 1 minute long and end within 1 month.
                        `)
                    ],
                    components: disableAll(m)
                }));

                let endStr: number | null = null;
                const end = await message.channel.awaitMessages({
                    max: 1,
                    time: 30_000,
                    filter: (m) =>
                        m.author.id === message.author.id &&
                        (endStr = parseStrToMs(m.content)) !== null &&
                        endStr >= 0 && // not negative
                        endStr >= 1000 * 60 && // longer than 1 minute
                        endStr <= monthMs // less than a month
                });
    
                if (end.size === 0) {
                    return void dontThrow(m.edit({
                        embeds: [this.Embed.error(`Didn't respond with a valid time, time wasn't changed.`)],
                        components: enableAll(m)
                    }));
                }
    
                sql.push(`endDate = $${$++}::timestamp`);
                params.push(new Date(Date.now() + endStr!));

                return void dontThrow(m.edit({
                    embeds: [
                        this.Embed.ok(
                        `Changed ending to ${time(new Date(Date.now() + endStr!))}, ` + 
                        `confirm the changes by pressing the done button or continue.\n` +
                        `To disregard changes, ignore the prompt and the changes will eventually be canceled.`
                        )
                    ],
                    components: enableAll(m)
                }));
            } else if (i.customId === 'prize') {
                await dontThrow(i.update({
                    embeds: [
                        this.Embed.ok(`${bold('What is the new prize?')}`)
                    ],
                    components: disableAll(m)
                }));

                const prize = await message.channel.awaitMessages({
                    max: 1,
                    time: 60 * 1000 * 5,
                    filter: (m) =>
                        m.author.id === message.author.id &&
                        m.content.length > 0
                });
    
                if (prize.size === 0) {
                    return void dontThrow(m.edit({
                        embeds: [this.Embed.error(`Didn't respond in time, prize wasn't changed.`)],
                        components: enableAll(m)
                    }));
                }
    
                sql.push(`prize = $${$++}::text`);
                params.push(prize.first()!.content);
    
                return void dontThrow(m.edit({ 
                    embeds: [
                        this.Embed.ok(`
                        The prize was changed.

                        Click the ${inlineCode('save')} button to save these changes!
                        `)
                    ],
                    components: enableAll(m)
                }));
            } else if (i.customId === 'winners') {
                await dontThrow(i.update({
                    embeds: [
                        this.Embed.ok(`${bold('How many winners should there be now?')}`)
                    ],
                    components: disableAll(m)
                }));

                const winners = await message.channel.awaitMessages({
                    max: 1,
                    time: 20_000,
                    filter: (m) =>
                        m.author.id === message.author.id &&
                        winnersRange(Number(m.content))
                });
    
                if (winners.size === 0) {
                    return void dontThrow(m.edit({
                        embeds: [this.Embed.error(`Didn't respond in time, number of winners wasn't changed.`)],
                        components: enableAll(m)
                    }));
                }
    
                sql.push(`winners = $${$++}::smallint`);
                params.push(Number(winners.first()!.content));
    
                return void dontThrow(m.edit({ 
                    embeds: [
                        this.Embed.ok(`
                        Number of winners will be changed to ${winners.first()!.content}!

                        Click the ${inlineCode('save')} button to save these changes!
                        `)
                    ],
                    components: enableAll(m)
                }));
            }
        });
        
        c.on('end', async (c, r) => {
            if (r === 'cancel') {
                return void dontThrow(c.last()!.update({
                    embeds: [this.Embed.error('Edit canceled, giveaway is unchanged!')],
                    components: []
                }));
            } else if (r === 'save') {
                await dontThrow(c.last()!.deferReply());
                params.push(message.guild.id, message.author.id, id);
                
                const { rows } = await pool.query<GiveawayEdit>(`
                    UPDATE kbGiveaways
                    SET
                    ${sql.join(', ')}
                    WHERE 
                        guildId = $${$++}::text AND 
                        initiator = $${$++}::text AND
                        id = $${$++}::uuid
                    RETURNING id;
                `, params);
                
                return void dontThrow(c.last()!.editReply({
                    embeds: [
                        this.Embed.ok(`Giveaway ${inlineCode(rows[0].id)} has been edited successfully!`)
                    ]
                }));
            }
        });
    }
}
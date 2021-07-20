import { MessageActionRow, Interaction, Message } from 'discord.js';
import { Components, disableAll } from '../../lib/Utility/Constants/Components.js';
import { Command } from '../../Structures/Command.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { createContext, runInContext } from 'vm';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';

const symbols = /^-|\+|\*|\/|\.|\(|\)$/;
/** Symbols an input is not allowed to start with */
const partialSymbols = /^-|\+|\*|\/$/;
const leadingZero = /^0+/g;
const context = createContext(Object.create(null));
const squiggles = 
    '\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~' + 
    '\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super([
            'A functioning calculator in Discord...'
        ], {
            name: 'calculator',
            folder: 'Bot',
            args: [0, 0],
            aliases: ['calc'],
            ratelimit: 3,
            ownerOnly: true
        });
    }

    async init(message: Message) {
        const rows = [
            new MessageActionRow().addComponents(
                Components.approve('(', '('),
                Components.approve(')', ')'),
                Components.approve('.', '.'),
                // Components.approve('idk', 'idk')
            ),
            new MessageActionRow().addComponents(
                Components.secondary('1', '1'),
                Components.secondary('2', '2'),
                Components.secondary('3', '3'),
                Components.approve('+', '+')
            ),
            new MessageActionRow().addComponents(
                Components.secondary('4', '4'),
                Components.secondary('5', '5'),
                Components.secondary('6', '6'),
                Components.approve('-', '-')
            ),
            new MessageActionRow().addComponents(
                Components.secondary('7', '7'),
                Components.secondary('8', '8'),
                Components.secondary('9', '9'),
                Components.approve('*', '*')
            ),
            new MessageActionRow().addComponents(
                Components.deny('Stop', 'stop'),
                Components.secondary('0', '0'),
                Components.deny('=', '='),
                Components.approve('/', '/')
            )
        ];

        const m = await message.channel.send({ 
            embeds: [
                this.Embed.success(`
                ${squiggles}
                \`\`\`Empty\`\`\`
                ${squiggles}
                `)
            ],
            components: rows
        });
        
        const filter = (interaction: Interaction) =>
            interaction.isMessageComponent() &&
            interaction.user.id === message.author.id &&
            interaction.message.id === m.id;

        let lastAction = ''
        const actions: string[] = [];

        const collector = m.createMessageComponentCollector({ filter, time: 60000, max: 15 });
        collector.on('collect', i => {
            if ( // used a symbol when there were no previous actions or previous action wasn't a number
                (
                    actions.length === 0 &&
                    !Number.isInteger(Number(actions[actions.length - 1])) &&
                    lastAction.length === 0
                ) && 
                partialSymbols.test(i.customId)
            ) {
                return void dontThrow(i.update({ content: `Invalid action!` }));
            } else if (Number.isInteger(Number(i.customId))) { // used a number
                lastAction += i.customId;
            } else if (symbols.test(i.customId)) { // used a symbol
                if (lastAction.length !== 0) {
                    const removeLeadingZeroes = lastAction.replace(leadingZero, '');
                    actions.push(removeLeadingZeroes.length === 0 ? lastAction : removeLeadingZeroes);

                    lastAction = '';
                }
                actions.push(i.customId);
            } else {
                return collector.stop('stop');
            }

            const display = `${actions.join(' ')} ${lastAction}`;

            return void dontThrow(i.update({ 
                content: null,
                embeds: [
                    this.Embed.success(`
                    ${squiggles}
                    \`\`\`${display}\`\`\`
                    ${squiggles}
                    `)
                ] 
            }));
        });

        collector.on('end', (c, r) => {
            const removeLeadingZeroes = lastAction.replace(leadingZero, '');
            actions.push(removeLeadingZeroes.length === 0 ? lastAction : removeLeadingZeroes);

            if (symbols.test(actions[actions.length - 1]))
                actions.pop();

            const equation = actions.join('')
                .replace(/(\d|\.)\(/g, '$1*(') // 0(1+2) -> 0*(1+2), 52.(2) -> 52. * (2)
                .replace(/\)(\d|\.)/g, ')*$1') // (1+2)0 -> (1+2)*0, (2).5 -> (2)*.5
                .replace(/\)\(/g, ')*(') // (1+2)(2+3) -> (1+2)*(2+3)
                .replace(/\.{2,}/g, '.') // 1..3 -> 1.3
            
            let eq: number | string = 'Invalid input!'; 
            try {
                eq = runInContext(equation, context) as number;
            } catch {}

            if (eq !== 'Invalid input!' && typeof eq !== 'number') {
                return void dontThrow(c.last()[r !== 'stop' ? 'editReply' : 'update']({
                    content: 'Invalid calculations...',
                    components: disableAll(m)
                }));
            }

            const length = 6 + actions.join(' ').length + 3 + `${eq}`.length;
            const sentence = length > 30 // approximate number of chars to go "off" the screen
                ? `${actions.join(' ')}\n= ${eq}` 
                : `${actions.join(' ')} = ${eq}`;

            /** Formats the return value */
            const format = sentence
                .replace(/(\d)\s\./g, '$1.') // 1 . 2 -> 1. 2
                .replace(/\.\s(\d)/g, '.$1') // 1. 2 -> 1.2

            return void dontThrow(c.last()[r !== 'stop' ? 'editReply' : 'update']({
                content: null,
                components: disableAll(m),
                embeds: [
                    this.Embed.success(`
                    ${squiggles}
                    \`\`\`${format}\`\`\`
                    ${squiggles}
                    `)
                ]
            }));
        });
    }
}
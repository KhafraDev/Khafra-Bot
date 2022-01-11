import { Interactions } from '#khaf/Interaction';
import { logger } from '#khaf/Logger';
import { Components, disableAll } from '#khaf/utility/Constants/Components.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { isTextBased } from '#khaf/utility/Discord.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { codeBlock, inlineCode } from '@khaf/builders';
import { APIMessage, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { ChatInputCommandInteraction, Message, MessageActionRow } from 'discord.js';
import { createContext, runInContext } from 'vm';

class Parser extends Array<string> {
    private openParenthesis = 0;

    public constructor (tokens: string[] = []) {
        super();

        this.push(...tokens);
    }

    public isOperation (token?: string): token is '+' | '-' | '*' | '/' {
        return !token || ['+', '-', '*', '/'].includes(token);
    }

    public add (token: string) {
        if (token === '(') {
            this.openParenthesis++;
        } else if (token === ')') {
            this.openParenthesis--;
        }

        return this.push(token);
    }

    public valid (token: string) {
        const prev = this.at(-1);

        // Trying to use a symbol as the first step.
        if (this.length === 0 && this.isOperation(token)) {
            return false;
        }

        // If a decimal place was used, but there no
        // number afterwards. However, operations can
        // be performed on decimals such as .5.
        // IE: 52. +; 52. (
        //     3 * .2 is valid
        if (/\d/.test(this.at(-2)!) && prev === '.' && !/\d/.test(token)) {
            return false;
        }

        // Attempting to use multiple operations
        // in a row would result in an error.
        // IE: 3 + +; 4 / *; etc
        if (this.isOperation(token) && this.isOperation(prev)) {
            return false;
        }
        
        // If the calculator has no open parenthesis,
        // then a closing parenthesis would be invalid.
        if (token === ')' && this.openParenthesis === 0) {
            return false;
        }

        // If the last token and the token being added
        // are neither numbers, something is up. This
        // will be triggered by decimals and parenthesis.
        if (prev && !/\d/.test(prev) && !/\d/.test(token)) {
            // We can use both two closed & open
            // parenthesis in a row, not decimals though.
            if (token === '.' && token === prev) {
                return false;
            }

            // Attempting to close a parenthesis that
            // has nothing in it is not valid.
            // IE: ( ); ( ( )
            if (prev === '(' && token === ')') {
                return false;
            }
        }

        return true;
    }

    public toParseableString () {
        let output = '';

        for (let i = 0; i < this.length; i++) {
            const current = this[i];
            const prev = this.at(i - 1)!;

            // If there are no previous values.
            if (this.length === 1 || i === 0) {
                output += current;
                continue;
            }

            // If an open parenthesis is used right
            // after a number, multiply the values.
            // IE: 52(6) -> 52 * (6)
            if (/\d/.test(prev) && current === '(') {
                output += ` * ${current}`;
                continue;
            }

            // If a closed parenthesis is used before
            // a number, multiply the values.
            // IE (5 * 2) 6 -> (5 * 2) * 6
            if (prev === ')' && /\d|./.test(current)) {
                output += ` * ${current}`;
                continue;
            }

            output += current;
        }

        return output;
    }

    public override toString () {
        let output = '';

        for (let i = 0; i < this.length; i++) {
            const token = this[i];
            const prev = this[i - 1];
    
            if (/\d/.test(token) && /\d/.test(prev)) {
                output += token;    
            } else {
                output += ` ${token}`;
            }
        }
    
        return output;
    }
}

const context = createContext(Object.create(null));
const squiggles = 
    '\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~' + 
    '\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~';

const _disableAll = (m: APIMessage | Message<boolean>) => {
    if (m instanceof Message) return disableAll(m);
    if (!m.components) return [];

    return m.components.map(r => new MessageActionRow(r));
}

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'calculator',
            description: `Calculator in Discord!`
        };
        
        super(sc, {
            defer: true
        });
    }

    async init (interaction: ChatInputCommandInteraction) {
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
        
        const makeEmbed = (m: string) =>
            Embed.ok(`
            ${squiggles}
            ${codeBlock(m)}
            ${squiggles}
            `);

        const [err, int] = await dontThrow(interaction.editReply({
            embeds: [makeEmbed('Empty')],
            components: rows
        }));

        if (err !== null) {
            return `❌ An unexpected error occurred: ${inlineCode(err.message)}`;
        }

        let channel = interaction.channel;

        if (!channel) {
            const [err, c] = await dontThrow(interaction.client.channels.fetch(interaction.channelId));

            if (err !== null || c === null) {
                return `❌ Please invite the bot with the correct permissions to use this command!`;
            } else if (!isTextBased(c)) {
                return `❌ This command cannot be used in this channel!`;
            }

            channel = c;
        }

        const parser = new Parser();

        const collector = channel.createMessageComponentCollector({
            filter: (i) =>
                interaction.user.id === i.user.id &&
                int.id === i.message.id,
            idle: 30_000
        });

        collector.on('collect', (i) => {
            if (parser.length > 15) {
                collector.stop();

                return void dontThrow(i.update({
                    embeds: [makeEmbed(`${parser.toString()}\nLimited to 15 characters.`)],
                    components: _disableAll(int)
                }));
            } else if (i.customId === '=') {
                return collector.stop('calculate');
            } else if (!parser.valid(i.customId)) {
                const m = `You are attempting to perform an operation that isn't valid!`;

                return void dontThrow(i.update({
                    embeds: [makeEmbed(`${parser.toString()}\n${m}`)]
                }));
            }

            parser.add(i.customId);

            return void dontThrow(i.update({
                embeds: [makeEmbed(parser.toString())]
            }));
        });

        collector.on('end', (all, reason) => {
            const i = all.last()!;

            if (reason === 'calculate') {
                const parsed = parser.toParseableString();

                let eq: number | 'Invalid input!' = 'Invalid input!'; 
                try {
                    eq = runInContext(parsed, context) as number;
                } catch (e) {
                    logger.error(e);
                }

                if (eq === 'Invalid input!') {
                    return void dontThrow(i.update({
                        embeds: [makeEmbed(eq)],
                        components: _disableAll(int)
                    }));
                }

                return void dontThrow(i.update({
                    embeds: [makeEmbed(`${parsed} = ${eq}`)],
                    components: _disableAll(int)
                }));
            } else if (reason === 'idle') {
                return void dontThrow(i.update({
                    embeds: [makeEmbed(parser.toString())],
                    components: _disableAll(int)
                }));
            }
        })
    }
} 
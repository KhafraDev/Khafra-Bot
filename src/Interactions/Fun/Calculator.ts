import { Interactions } from '#khaf/Interaction';
import { logger } from '#khaf/Logger';
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { codeBlock } from '@discordjs/builders';
import type { APIEmbed, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { InteractionType } from 'discord-api-types/v10';
import type { ChatInputCommandInteraction, MessageComponentInteraction } from 'discord.js';
import { InteractionCollector } from 'discord.js';
import { randomUUID } from 'node:crypto';
import { createContext, runInContext } from 'node:vm';

class Parser extends Array<string> {
    private openParenthesis = 0;

    public constructor (tokens: string[] = []) {
        super();

        this.push(...tokens);
    }

    public isOperation (token?: string): token is '+' | '-' | '*' | '/' {
        return !token || ['+', '-', '*', '/'].includes(token);
    }

    public add (token: string): number {
        if (token === '(') {
            this.openParenthesis++;
        } else if (token === ')') {
            this.openParenthesis--;
        }

        return this.push(token);
    }

    public valid (token: string): boolean {
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

    public reset (): void {
        this.openParenthesis = 0;
        this.length = 0;
    }

    public toParseableString (): string {
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

    public override toString (): string {
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

export class kInteraction extends Interactions {
    constructor () {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'calculator',
            description: 'Calculator in Discord!'
        };

        super(sc);
    }

    async init (interaction: ChatInputCommandInteraction): Promise<void> {
        const id = randomUUID();
        const rows = [
            Components.actionRow([
                Buttons.approve('(', `(-${id}`),
                Buttons.approve(')', `)-${id}`),
                Buttons.approve('.', `.-${id}`),
                Buttons.deny('CE', `clear-${id}`)
            ]),
            Components.actionRow([
                Buttons.secondary('1', `1-${id}`),
                Buttons.secondary('2', `2-${id}`),
                Buttons.secondary('3', `3-${id}`),
                Buttons.approve('+', `+-${id}`)
            ]),
            Components.actionRow([
                Buttons.secondary('4', `4-${id}`),
                Buttons.secondary('5', `5-${id}`),
                Buttons.secondary('6', `6-${id}`),
                Buttons.approve('-', `--${id}`)
            ]),
            Components.actionRow([
                Buttons.secondary('7', `7-${id}`),
                Buttons.secondary('8', `8-${id}`),
                Buttons.secondary('9', `9-${id}`),
                Buttons.approve('*', `*-${id}`)
            ]),
            Components.actionRow([
                Buttons.deny('Stop', `stop-${id}`),
                Buttons.secondary('0', `0-${id}`),
                Buttons.deny('=', `=-${id}`),
                Buttons.approve('/', `/-${id}`)
            ])
        ];

        const makeEmbed = (m: string): APIEmbed =>
            Embed.ok(`
            ${squiggles}
            ${codeBlock(m)}
            ${squiggles}
            `);

        const parser = new Parser();
        const int = await interaction.reply({
            embeds: [makeEmbed('Empty')],
            components: rows
        });

        const collector = new InteractionCollector<MessageComponentInteraction>(interaction.client, {
            interactionType: InteractionType.MessageComponent,
            idle: 30_000,
            filter: (i) =>
                interaction.user.id === i.user.id &&
                int.id === i.message.id &&
                i.customId.endsWith(id)
        });

        for await (const [i] of collector) {
            const token = i.customId[0] === '-' ? '-' : i.customId.split('-')[0];
            if (parser.length > 15) {
                collector.stop();

                await i.update({
                    embeds: [makeEmbed(`${parser.toString()}\nLimited to 15 characters.`)],
                    components: disableAll({ components: rows })
                });
            } else if (token === '=') {
                collector.stop('calculate');
                break;
            } else if (!parser.valid(token)) {
                const m = 'You are attempting to perform an operation that isn\'t valid!';

                await i.update({
                    embeds: [makeEmbed(`${parser.toString()}\n${m}`)]
                });
            } else {
                if (token === 'clear') {
                    parser.reset();
                } else {
                    parser.add(token);
                }

                await i.update({
                    embeds: [makeEmbed(parser.toString())]
                });
            }
        }

        if (collector.collected.size !== 0) {
            const i = collector.collected.last()!;

            if (i.replied) return;

            if (collector.endReason === 'calculate') {
                const parsed = parser.toParseableString();

                let eq: number | 'Invalid input!' = 'Invalid input!';
                try {
                    eq = runInContext(parsed, context) as number;
                } catch (e) {
                    logger.error('error in calculator', e);
                }

                if (eq === 'Invalid input!') {
                    await i.update({
                        embeds: [makeEmbed(eq)],
                        components: disableAll({ components: rows })
                    });
                } else {
                    await i.update({
                        embeds: [makeEmbed(`${parser.toString()} = ${eq}`)],
                        components: disableAll({ components: rows })
                    });
                }
            }
        } else {
            await interaction.editReply({
                components: disableAll({ components: rows })
            });
        }
    }
}
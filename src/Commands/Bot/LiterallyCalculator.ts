import { MessageActionRow, Interaction, Message } from 'discord.js';
import { Components } from '../../lib/Utility/Constants/Components.js';
import { Command } from '../../Structures/Command.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

const symbols = /^-|\+|\*|\/$/;
const leadingZero = /^0+/g;

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
            embeds: [this.Embed.success('\`\`\`Empty\`\`\`')],
            components: rows
        });
        
        const filter = (interaction: Interaction) =>
            interaction.isMessageComponent() &&
            interaction.user.id === message.author.id &&
            interaction.message.id === m.id;

        let lastAction = '',
            actions: string[] = [];

        const collector = m.createMessageComponentInteractionCollector(filter, { time: 60000, max: 10 });
        collector.on('collect', i => {
            if ( // used a symbol when there were no previous actions or previous action wasn't a number
                (
                    actions.length === 0 &&
                    !Number.isInteger(Number(actions[actions.length - 1])) &&
                    lastAction.length === 0
                ) && 
                symbols.test(i.customID)
            ) {
                return void i.update({ content: `Invalid action!` });
            } else if (Number.isInteger(Number(i.customID))) { // used a number
                lastAction += i.customID;
            } else if (symbols.test(i.customID)) { // used a symbol
                if (lastAction.length !== 0) {
                    actions.push(lastAction.replace(leadingZero, ''));
                    lastAction = '';
                }
                actions.push(i.customID);
            } else {
                actions.push(lastAction.replace(leadingZero, ''));
                return collector.stop();
            }

            const display = `${actions.join(' ')} ${lastAction}`;

            return void i.update({ 
                content: null,
                embeds: [
                    this.Embed.success(`\`\`\`${display}\`\`\``)
                ] 
            });
        });

        collector.on('end', () => {
            if (/^-|\+|\*|\/$/.test(actions[actions.length - 1]))
                actions.pop();

            // TODO(@KhafraDev): replace eval with vm.*

            return void m.edit({
                content: null,
                embeds: [
                    this.Embed.success(`\`\`\`${actions.join(' ')} = ${eval(actions.join(''))}\`\`\``)
                ],
                components: [] 
            });
        });
    }
}
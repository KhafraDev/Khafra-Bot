import { Message } from 'discord.js';
import { inspect } from 'util';
import { createContext, runInContext } from 'vm';
import { Command, Arguments } from '../../Structures/Command.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super([
            'Evaluate a statement.'
        ], {
            name: 'eval',
            folder: 'Bot',
            args: [0],
            ratelimit: 0,
            ownerOnly: true
        });
    }

    async init(message: Message, { content }: Arguments) {
        // https://github.com/nodejs/node/blob/e46c680bf2b211bbd52cf959ca17ee98c7f657f5/test/parallel/test-vm-basic.js#L132-L145

        if (content.includes('import'))
            return this.Embed.fail('Import isn\'t supported yet.');

        const context = createContext({ message });
        let ret: unknown;

        try {
            ret = runInContext(content, context);
        } catch (e) {
            ret = e;
        }

        const text = inspect(ret, true, 1, false);
        return this.Embed.success(`
        \`\`\`js\n${text.slice(0, 2004).trim()}\`\`\`
        `);
    }
}
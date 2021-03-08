import { Command } from '../../../Structures/Command.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get the categories of atrocities committed by Trump!'
            ],
			{
                name: 'trumpkey',
                folder: 'Utility',
                args: [0, 3]
            }
        );
    }

    async init() {
        return this.Embed.success(`
        🔴 - Sexual Misconduct, Harassment, & Bullying
        ⚫ – White Supremacy, Racism, Homophobia, Transphobia, & Xenophobia
        🔵 – Public Statements / Tweets
        🟡 – Collusion with Russia & Obstruction of Justice
        🟣 – Trump Staff & Administration
        🐷 – Trump Family Business Dealings
        🟠 – Policy
        🟢 – Environment
        `);
    }
}
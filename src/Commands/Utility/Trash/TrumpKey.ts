import { Command } from '../../../Structures/Command.js';

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get the categories of atrocities committed by Trump!'
            ],
			{
                name: 'trumpkey',
                folder: 'Trash',
                args: [0, 0]
            }
        );
    }

    async init() {
        return this.Embed.ok(`
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
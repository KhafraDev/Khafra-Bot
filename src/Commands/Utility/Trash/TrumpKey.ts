import { Command } from '#khaf/Command';
import { type Embed } from '@khaf/builders';

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

    async init (): Promise<Embed> {
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
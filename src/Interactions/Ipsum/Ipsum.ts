import { CommandInteraction } from 'discord.js';
import { Interactions } from '../../Structures/Interaction.js';
import { inlineCode } from '@khaf/builders';
import { AccountOptions, IpsumAccount } from '../../Ipsum/Account/Account.js';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'ipsum',
            description: 'Define a word or short phrase!',
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'account',
                    description: 'creates a new account',
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'option',
                            description: 'perform an action on your account or create an account',
                            required: true,
                            choices: [
                                { name: 'create', value: AccountOptions.CREATE },
                                { name: 'delete', value: AccountOptions.DELETE }
                            ]
                        }
                    ]
                }
            ]
        };

        super(sc);
    }

    async init(interaction: CommandInteraction) {
        const subcommand = interaction.options.getSubcommand(true);
        
        if (subcommand === 'account') {
            const option = interaction.options.getString('option', true);

            if (option === AccountOptions.CREATE) {
                const account = await IpsumAccount.create(interaction.user.id);

                if (account === null) {
                    return Embed.error(`You already have an account! Did you mean to ${inlineCode(`/ipsum account delete`)}?`);
                }

                return Embed.ok(`
                Created an account for you!

                ID: ${inlineCode(account.playerid)}
                `);
            } else if (option === AccountOptions.DELETE) {
                const deleted = await IpsumAccount.delete(interaction.user.id);

                if (deleted === null) {
                    return Embed.ok(`You don't have an account! So I guess it was deleted?`);
                }

                return Embed.ok(`Deleted your account, play again soon? ❤️`);
            }
        }
    }
} 
import { CommandInteraction } from 'discord.js';
import { Interactions } from '../../Structures/Interaction.js';
import { inlineCode, SlashCommandBuilder } from '@discordjs/builders';
import { AccountOptions, IpsumAccount } from '../../Ipsum/Account/Account.js';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';

export class kInteraction extends Interactions {
    constructor() {
        const sc = new SlashCommandBuilder()
            .setName('ipsum')
            .addSubcommand(command => command
                .setName('account')
                .addStringOption(option => option
                    .setName('option')
                    .setDescription('perform an action on your account or create an account')
                    .setRequired(true)
                    .addChoice('create', AccountOptions.CREATE)
                    .addChoice('delete', AccountOptions.DELETE)
                )
                .setDescription('creates a new account')
            )
            .setDescription('Define a word or short phrase!');

        super(sc as unknown as SlashCommandBuilder);
    }

    async init(interaction: CommandInteraction) {
        const subcommand = interaction.options.getSubcommand(true);
        
        if (subcommand === 'account') {
            const option = interaction.options.getString('option', true);

            if (option === AccountOptions.CREATE) {
                const account = await IpsumAccount.create(interaction.user.id);

                if (account === null) {
                    return Embed.fail(`You already have an account! Did you mean to ${inlineCode(`/ipsum account delete`)}?`);
                }

                return Embed.success(`
                Created an account for you!

                ID: ${inlineCode(account.playerid)}
                `);
            } else if (option === AccountOptions.DELETE) {
                const deleted = await IpsumAccount.delete(interaction.user.id);

                if (deleted === null) {
                    return Embed.success(`You don't have an account! So I guess it was deleted?`);
                }

                return Embed.success(`Deleted your account, play again soon? ❤️`);
            }
        }
    }
} 
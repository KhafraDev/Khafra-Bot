import { Interactions } from '#khaf/Interaction';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { bold } from '@discordjs/builders';
import { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ChatInputCommandInteraction, Guild } from 'discord.js';

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'members',
            description: 'Show the number of members currently in this server!'
        };

        super(sc);
    }

    async init (interaction: ChatInputCommandInteraction): Promise<string> {
        let guild!: Guild | null;

        if (!interaction.guild) {
            if (interaction.guildId) {
                ([, guild] = await dontThrow(interaction.client.guilds.fetch(interaction.guildId)));
            }

            if (guild === null) {
                return '❌ The guild could not be fetched. Reinvite the bot with full permissions to use this command!';
            }
        } else {
            guild = interaction.guild;
        }

        return `✅ There are ${bold(guild.memberCount.toLocaleString())} members in ${guild.name}!`;
    }
}
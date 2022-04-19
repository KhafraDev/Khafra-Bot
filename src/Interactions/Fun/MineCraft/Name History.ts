import { InteractionSubCommand } from '#khaf/Interaction';
import { Embed, EmbedUtil } from '#khaf/utility/Constants/Embeds.js';
import { inlineCode, bold, time } from '@discordjs/builders';
import { getNameHistory, UUID } from '@khaf/minecraft';
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'minecraft',
            name: 'name-history'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const username = interaction.options.getString('username', true);
        const uuid = await UUID(username);
        const nameHistory = uuid !== null ? await getNameHistory(uuid.id) : null;

        if (uuid === null || nameHistory === null) {
            return {
                content: '❌ Player could not be found!',
                ephemeral: true
            }
        }

        let description = `● ${bold('Original Name:')} ${inlineCode(nameHistory[0].name)}\n`;

        for (let i = 1; i < nameHistory.length; i++) {
            const { name, changedToAt } = nameHistory[i] as (typeof nameHistory)[1];
            const line = `● ${inlineCode(name)} at ${time(changedToAt / 1000)}\n`;

            if (description.length + line.length > 2048) {
                break;
            }

            description += line;
        }

        const embed = EmbedUtil.setAuthor(
            Embed.ok(description),
            { name: `${uuid.name} (${uuid.id})` }
        );

        return {
            embeds: [embed]
        }
    }
}
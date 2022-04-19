import { InteractionSubCommand } from '#khaf/Interaction';
import { Components } from '#khaf/utility/Constants/Components.js';
import { Embed, EmbedUtil } from '#khaf/utility/Constants/Embeds.js';
import type { MessageActionRowComponentBuilder } from '@discordjs/builders';
import { ActionRowBuilder, bold } from '@discordjs/builders';
import { getSkin, UUID } from '@khaf/minecraft';
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import { Attachment } from 'discord.js';
import { Buffer } from 'node:buffer';
import { request } from 'undici';

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'minecraft',
            name: 'skin'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const username = interaction.options.getString('username', true);
        const type = interaction.options.getString('type') ?? 'frontfull';
        const uuid = await UUID(username);

        const description = `
		● ${bold('Username:')} ${uuid?.name}
		● ${bold('ID:')} ${uuid?.id}
		`;

        if (uuid === null) {
            return {
                content: '❌ Player could not be found!',
                ephemeral: true
            }
        } else if (type === 'skin') {
            const skin = (await getSkin(uuid.id))[0];
            const { body } = await request(skin);
            const b = Buffer.from(await body.arrayBuffer());

            const attachment = new Attachment(b, 'skin.png');

            return {
                embeds: [
                    EmbedUtil.setImage(
                        Embed.ok(description),
                        { url: 'attachment://skin.png' }
                    )
                ],
                components: [
                    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                        Components.link(
                            'Change Skin',
                            `https://www.minecraft.net/en-us/profile/skin/remote?url=${skin}&model=classic`
                        )
                    )
                ],
                files: [attachment]
            }
        }

        const embed = EmbedUtil.setImage(
            Embed.ok(description),
            { url: `https://visage.surgeplay.com/${type}/512/${uuid.id}` }
        );

        return {
            embeds: [embed]
        }
    }
}
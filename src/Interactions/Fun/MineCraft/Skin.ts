import { InteractionSubCommand } from '#khaf/Interaction';
import { Components } from '#khaf/utility/Constants/Components.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import type { MessageActionRowComponent } from '@discordjs/builders';
import { ActionRow, bold } from '@discordjs/builders';
import { getSkin, UUID } from '@khaf/minecraft';
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import { MessageAttachment } from 'discord.js';
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

            const attachment = new MessageAttachment(b, 'skin.png');

            return {
                embeds: [
                    Embed.ok(description).setImage('attachment://skin.png')
                ],
                components: [
                    new ActionRow<MessageActionRowComponent>().addComponents(
                        Components.link(
                            'Change Skin',
                            `https://www.minecraft.net/en-us/profile/skin/remote?url=${skin}&model=classic`
                        )
                    )
                ],
                files: [attachment]
            }
        }

        const embed = Embed.ok(description).setImage(
            `https://visage.surgeplay.com/${type}/512/${uuid.id}`
        );

        return {
            embeds: [embed]
        }
    }
}
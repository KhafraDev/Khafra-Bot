import { Arguments, Command } from '../../Structures/Command.js';
import { getMentions, validSnowflake } from '../../lib/Utility/Mentions.js';
import { isVoice, Message } from '../../lib/types/Discord.js.js';
import { Components, disableAll } from '../../lib/Utility/Constants/Components.js';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { MessageActionRow, Permissions } from 'discord.js';
import {
    InviteTargetType,
    RESTPostAPIChannelInviteJSONBody,
    APIVersion,
    Routes,
    APIInvite
} from 'discord-api-types/v9';
import { REST } from '@discordjs/rest';
import { hideLinkEmbed, hyperlink, inlineCode } from '@khaf/builders';

const enum Activities {
    POKER = '755827207812677713',
    BETRAYALIO = '773336526917861400',
    YOUTUBE_TOGETHER = '755600276941176913',
    FISHINGTONIO = '814288819477020702',
    CHESS = '832012774040141894',
    DOODLECREW = '878067389634314250',
    WORDSNACKS = '879863976006127627',
    LETTERTILE = '879863686565621790',
    SPELLCAST = '852509694341283871'
}

const rest = new REST({ version: APIVersion }).setToken(process.env.TOKEN!);

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Play a game in VC!',
                '866022233330810930 [channel id]',
                '#general [channel mention]'
            ],
			{
                name: 'activity',
                folder: 'Server',
                args: [1, 1],
                ratelimit: 10,
                permissions: [
                    Permissions.FLAGS.CREATE_INSTANT_INVITE,
                    Permissions.FLAGS.START_EMBEDDED_ACTIVITIES
                ],
                guildOnly: true
            }
        );
    }

    async init(message: Message, { content }: Arguments) {
        const channel = 
            await getMentions(message, 'channels') ?? 
            message.guild.channels.cache.find(c => c.name.toLowerCase() === content.toLowerCase());

        if (!isVoice(channel)) {
            return this.Embed.error('Games can only be created in voice channels!');
        } else if (!hasPerms(channel, message.member, Permissions.FLAGS.VIEW_CHANNEL)) {
            return this.Embed.error('No channel with that name was found!'); 
        } else if (!hasPerms(channel, message.guild.me, Permissions.FLAGS.CREATE_INSTANT_INVITE)) {
            return this.Embed.error(`I don't have permission to create invites in ${channel}`);
        }

        const m = await message.channel.send({
            embeds: [
                this.Embed.ok(`Please choose which activity you want! -> ${channel}`)
            ],
            components: [
                new MessageActionRow().addComponents(
                    Components.approve('Poker', Activities.POKER),
                    Components.deny('Betrayal.io', Activities.BETRAYALIO),
                    Components.primary('YouTube Together', Activities.YOUTUBE_TOGETHER),
                    Components.secondary('Fishington.io', Activities.FISHINGTONIO),
                    Components.approve('Chess in the Park', Activities.CHESS)
                ),
                new MessageActionRow().addComponents(
                    Components.approve('Doodle Crew', Activities.DOODLECREW),
                    Components.deny('WordSnacks', Activities.WORDSNACKS),
                    Components.primary('LetterTile', Activities.LETTERTILE)
                )
            ]
        });

        const [discordError, interaction] = await dontThrow(m.awaitMessageComponent({
            time: 60_000,
            filter: (interaction) =>
                interaction.user.id === message.author.id &&
                validSnowflake(interaction.customId)
        }));

        if (discordError !== null) {
            return void dontThrow(m.edit({
                embeds: [
                    this.Embed.ok('No response, canceled the command.')
                ],
                components: disableAll(m)
            }));
        } else {
            void dontThrow(interaction.update({
                components: disableAll(m)
            }));
        }

        const [fetchError, invite] = await dontThrow(rest.post(
            Routes.channelInvites(channel.id),
            {
                headers: { 'Content-Type': 'application/json' },
                body: {
                    max_age: 86400,
                    target_type: InviteTargetType.EmbeddedApplication,
                    target_application_id: interaction.customId
                } as RESTPostAPIChannelInviteJSONBody
            }
        ) as Promise<APIInvite>);

        if (fetchError !== null) {
            return this.Embed.error(`An unexpected error occurred: ${inlineCode(fetchError.message)}`);
        }

        const hl = hyperlink('Click Here', hideLinkEmbed(`https://discord.gg/${invite.code}`));
        const str = `${hl} to open ${invite.target_application!.name} in ${channel}!`;

        return this.Embed.ok(str);
    }
}
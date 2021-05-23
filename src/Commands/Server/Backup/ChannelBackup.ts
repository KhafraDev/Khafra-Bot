import { Command } from '../../../Structures/Command.js';
import { Message, MessageAttachment, Permissions } from 'discord.js';
import { getMentions } from '../../../lib/Utility/Mentions.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { isText, isVoice } from '../../../lib/types/Discord.js.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Create a channel backup that Khafra-Bot can load.',
                '#general',
                '705896160673661041'
            ],
			{
                name: 'channelbackup',
                folder: 'Server',
                aliases: [ 'chanbackup' ],
                args: [0, 1],
                guildOnly: true,
                permissions: [ 
                    Permissions.FLAGS.ATTACH_FILES, 
                    Permissions.FLAGS.MANAGE_CHANNELS
                ]
            }
        );
    }

    async init(message: Message) {
        const channel = await getMentions(message, 'channels') ?? message.channel;

        // TODO(@KhafraDev): permissionOverwrites
        // TODO(@KhafraDev): pins

        const obj = channel.toJSON() as Record<string, unknown>;
        
        // remove properties that are useless in a backup
        if (isText(channel))
            ['createdTimestamp', 'deleted', 'lastMessageID', 'lastPinTimestamp', 'messages']
                .forEach(p => delete obj[p]);
        else if (isVoice(channel))
            ['createdTimestamp', 'deleted']
                .forEach(p => delete obj[p]);

        return new MessageAttachment(
            Buffer.from(JSON.stringify(obj)), 
            `backup-${channel.id}.json`
        );
    }
}
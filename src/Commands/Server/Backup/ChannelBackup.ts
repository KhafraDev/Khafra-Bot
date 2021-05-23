import { Command } from '../../../Structures/Command.js';
import { Channel, Message, MessageAttachment, Permissions } from 'discord.js';
import { getMentions } from '../../../lib/Utility/Mentions.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { isCategory } from '../../../lib/types/Discord.js.js';

const propsToRemove = (c: Channel): readonly string[] => {
    switch (c.type) {
        case 'text':
        case 'news':
            return ['createdTimestamp', 'deleted', 'lastMessageID', 'lastPinTimestamp', 'messages'];
        case 'voice':
        case 'category':
            return ['createdTimestamp', 'deleted'];
        default:
            return null;
    }
}

const deleteProps = (c: Channel) => {
    const toRemove = propsToRemove(c);
    const json = c.toJSON() as Record<string, unknown>;

    if (Array.isArray(toRemove))
        for (const prop of toRemove)
            delete json[prop];

    return json;
}

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

        const obj = deleteProps(channel);
               
        if (isCategory(channel)) {
            const children = channel.children.map(c => deleteProps(c));
            Object.assign(obj, { children });
        }

        return new MessageAttachment(
            Buffer.from(JSON.stringify(obj)), 
            `backup-${channel.id}.json`
        );
    }
}
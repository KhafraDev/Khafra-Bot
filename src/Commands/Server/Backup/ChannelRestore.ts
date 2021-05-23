import { Command } from '../../../Structures/Command.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { CategoryChannel, GuildCreateChannelOptions, Message, OverwriteResolvable, Permissions } from 'discord.js';
import { extname } from 'path';
import fetch from 'node-fetch';
import { AbortSignal } from 'node-fetch/externals';
import { validSnowflake } from '../../../lib/Utility/Mentions.js';
import { Range } from '../../../lib/Utility/Range.js';
import { isExplicitText, isText, isVoice } from '../../../lib/types/Discord.js.js';

const channelTypes = ['text', 'news', 'voice', 'category'] as const;
const channelNameRange = Range(1, 100, true);
const channelTopicRange = Range(0, 1024, true);
const channelPosRange = Range(0, 100, true);
const isCategoryBackup = (json: Backup | CategoryBackup): json is CategoryBackup => json.type === 'category';

const make = async (message: Message, name: string, o: GuildCreateChannelOptions) => {
    return await message.guild.channels.create(name, {
        type: o.type,
        topic: o.topic,
        nsfw: o.nsfw,
        // bitrate: j.type === 'voice' ? j.bitrate : undefined
        // userLimit: j.type === 'voice' ? j.userLimit : undefined
        parent: o.parent,
        // permissionOverwrites: j.permissionOverwrites,
        position: o.position,
        rateLimitPerUser: o.rateLimitPerUser, // for anything other than text, this equates to undefined
        reason: `Backup restored by Khafra-Bot (initiated from ${message.author.tag} - ${message.author.id})`
    });
}

interface Backup {
    type: typeof channelTypes[number]
    id: string
    name: string
    rawPosition: number
    parentID: string
    permissionOverwrites: OverwriteResolvable[]
    topic: string
    nsfw: boolean
    rateLimitPerUser: number
    guild: string
}

interface CategoryBackup extends Backup {
    type: 'category'
    children: Backup[]
}

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Create a new channel with a backup file.',
                '[message attachment from the channelbackup command]',
            ],
			{
                name: 'channelrestore',
                folder: 'Server',
                aliases: [ 'chanrestore' ],
                args: [0, 0],
                guildOnly: true,
                permissions: [ 
                    Permissions.FLAGS.ATTACH_FILES, 
                    Permissions.FLAGS.MANAGE_CHANNELS
                ],
                errors: {
                    FetchError: 'An invalid JSON file was passed to the command!' // res.json throws a FetchError on invalid json
                }
            }
        );
    }

    async init(message: Message) {
        if (message.attachments.size === 0)
            return this.Embed.generic(this, 'Missing backup file!');

        const locale = message.guild.preferredLocale;
        const attachment = message.attachments.find(u => extname(u.url) === '.json');
        if (!attachment)
            return this.Embed.fail('No backup file included!');
        else if (attachment.size > 1e6)
            return this.Embed.fail('This file is way too large to be backup file...');

        const a = new AbortController();
        setTimeout(() => a.abort(), 30000);
        const r = await fetch(attachment.url, { signal: a.signal as unknown as AbortSignal });
        const j = await r.json() as Backup | CategoryBackup;

        // time to verify the json, pretty extensively
        // after this we can verify everything should be valid
        if (
            j === null || // JSON.parse('null') === null
            !channelTypes.includes(j.type) ||
            !Array.isArray(j.permissionOverwrites) ||
            (isCategoryBackup(j) && !Array.isArray(j.children)) ||
            !validSnowflake(j.id) ||
            !validSnowflake(j.guild) ||
            !validSnowflake(j.parentID) ||
            !channelPosRange.isInRange(j.rawPosition) ||
            !channelNameRange.isInRange(j.name?.length) ||
            !channelTopicRange.isInRange(j.topic?.length) ||
            typeof j.nsfw !== 'boolean' ||
            typeof j.rawPosition !== 'number' ||
            typeof j.rateLimitPerUser !== 'number'
        )
            return this.Embed.fail('Invalid backup file, try again!');

        if (message.guild.channels.cache.has(j.id))
            return this.Embed.fail(`
            Channel can't be restored; it's still in the guild!
            
            The \`restore\` command is used for *restoring* a channel; not cloning.
            `);

        // although channel ids can't be duplicate, channel names can be
        const channelName = message.guild.channels.cache.find(c => c.name === j.name)
            ? `${j.name}-backup`
            : j.name;

        // if it's a category channel, we have to recreate the category
        // and then remake each individual channel inside of it
        if (isCategoryBackup(j)) {
            const cat = await make(message, channelName, {
                type: j.type,
                position: j.rawPosition
            }) as CategoryChannel;

            const pr = j.children
                .filter(c => !message.guild.channels.cache.has(c.id))
                .map(c => make(message, c.name, {
                    type: j.type,
                    topic: j.topic,
                    nsfw: j.nsfw,
                    parent: cat.id,
                    position: j.rawPosition,
                    rateLimitPerUser: j.rateLimitPerUser
                }));
            const settled = await Promise.allSettled(pr);
            const rejected = settled.filter(c => c.status === 'rejected');

            return this.Embed.success(`
            Created category ${cat} with ${settled.length - rejected.length} children.

            ${rejected.length > 0 ? `I failed to create ${rejected} channels.` : ''}
            `.trim());
        }

        const n = await make(message, channelName, {
            type: j.type,
            topic: j.topic,
            nsfw: j.nsfw,
            parent: j.parentID,
            position: j.rawPosition,
            rateLimitPerUser: j.rateLimitPerUser
        });

        const embed = this.Embed.success(`
        Restored ${n} with the settings provided:
        `).addFields([
            { name: '**Type:**', value: n.type },
            { name: '**Parent:**', value: `${n.parent?.name ?? 'None'}` },
            { name: '**Position:**', value: n.position.toLocaleString(locale) }
        ]);

        if (isText(n))
            embed.addFields([
                { name: '**Topic:**', value: n.topic.length > 100 ? `${n.topic.slice(0, 100)}...` : (n.topic || 'None') },
                { name: '**NSFW:**', value: n.nsfw ? 'Yes' : 'No' }
            ]);
        else if (isVoice(n))
            embed.addFields([
                { name: '**Bitrate:**', value: n.bitrate.toLocaleString(locale) },
                { name: '**User Limit:**', value: n.userLimit.toLocaleString(locale) }
            ]);

        if (isExplicitText(n)) // TextChannel falls under isText
            embed.addField('**Rate-Limit:**', n.rateLimitPerUser.toLocaleString(locale));

        return embed;
    }
}
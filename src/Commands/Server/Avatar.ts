import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { getMentions } from '#khaf/utility/Mentions.js';
import { type UnsafeEmbed } from '@discordjs/builders';
import { ImageExtension, ImageSize, ImageURLOptions } from '@discordjs/rest';
import { Message } from 'discord.js';
import { Arguments, Command } from '../../Structures/Command.js';

const avatarSizes: ImageSize[] = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096];
const avatarFormats: ImageExtension[] = ['webp', 'png', 'jpg', 'jpeg', 'gif'];

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Get someone\'s avatar!',
                '',
                '@Khafra#0001',
                '267774648622645249',
                '@Khafra#0001 --size 256 --format jpg',
                '@Khafra#0001 -s 256 -f gif'
            ],
            {
                name: 'avatar',
                folder: 'Server',
                args: [0, 5],
                aliases: ['av', 'a'],
                ratelimit: 3
            }
        );
    }

    async init (message: Message, { cli, content }: Arguments): Promise<UnsafeEmbed> {
        const user = await getMentions(message, 'users', content) ?? message.author;

        const opts: ImageURLOptions = {
            size: 512,
            extension: 'png',
            forceStatic: false
        };

        if (cli.size !== 0) {
            if (cli.has('size') || cli.has('s')) {
                const value = Number(cli.get('size') || cli.get('s')) as ImageSize;
                if (avatarSizes.includes(value)) {
                    opts.size = value;
                }
            }

            if (cli.has('format') || cli.has('f')) {
                const value = cli.get('format') || cli.get('f');
                if (typeof value === 'string' && avatarFormats.includes(value as ImageExtension)) {
                    opts.extension = value as ImageExtension;
                }
            }
        }

        const avatar = user.displayAvatarURL(opts);

        return Embed.ok(`${user}'s avatar`).setImage(avatar);
    }
}
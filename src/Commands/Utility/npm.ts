import { Command } from "../../Structures/Command.js";
import { Message } from "discord.js";
import { formatDate } from "../../lib/Utility/Date.js";
import { npm } from "../../lib/Backend/NPM/npmHandler.js";

export default class extends Command {
    constructor() {
        super(
            [
                'Search NPM\'s registry for a package',
                'node-fetch latest', 'typescript'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'npm',
                folder: 'Utility',
                aliases: [ 'npmjs' ],
                args: [1, 2]
            }
        );
    }

    async init(message: Message, args: string[]) {
        let _package;
        try {
            _package = await npm(args[0]);
        } catch(e) {
            return message.reply(this.Embed.fail(`
            An unexpected error occurred!
            ${e.message ? '``' + e.message + '``' : ''}
            `));
        }

        if('code' in _package) {
            return message.reply(this.Embed.fail('No package with that name was found!'));
        } else if('error' in _package) {
            return message.reply(this.Embed.fail(`Received error \`\`${_package.error}\`\`.`));
        }

        const dist = _package.versions[_package['dist-tags'][args[1] ?? 'latest']];
        const embed = this.Embed.success()
            .setAuthor('NPM', 'https://avatars0.githubusercontent.com/u/6078720?v=3&s=400', 'https://npmjs.com/')
            .setDescription(`
            [${dist.name}](https://npmjs.com/package/${dist.name})
            \`\`${_package.description.slice(0, 2000)}\`\`
            `)
            .addField('**Version:**', dist.version, true)
            .addField('**License:**', dist.license, true)
            .addField('**Author:**', _package.author?.name ?? 'N/A', true)
            .addField('**Last Modified:**', formatDate('MMMM Do, YYYY hh:mm:ss A t', _package.time?.modified), true)
            .addField('**Published:**', formatDate('MMMM Do, YYYY hh:mm:ss A t', _package.time?.created), true)
            .addField('**Homepage:**', _package.homepage ?? 'None', true)
            .addField('**Maintainers:**', dist.maintainers.slice(0, 10).map(u => u.name).join(', '), false)

        return message.reply(embed);
    }
}
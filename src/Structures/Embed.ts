import { MessageEmbed, PermissionString } from "discord.js";

export default class {
    /**
     * An embed for any type of error!
     */
    static fail(reason?: string) {
        const embed = new MessageEmbed()
            .setColor('#FF0000');

        if(reason) {
            embed.setDescription(reason);
        }
        return embed;
    }

    /**
     * An embed for a command being successfully executed!
     */
    static success (reason?: string) {
        const embed = new MessageEmbed()
            .setColor('#ffe449');
        
        if(reason) {
            embed.setDescription(reason);
        }
        
        return embed;
    }

    /**
     * An embed for missing permissions!
     */
    static missing_perms(perms: PermissionString[], admin?: boolean) {
        return this.fail(`
        One of us doesn't have the needed permissions!

        Both of us must have \`\`${perms.join(', ')}\`\` permissions to use this command!
        ${admin ? 'You must have \`\`ADMINISTRATOR\`\` perms to use this command!' : '' }
        `);
    }

    /**
     * An embed for missing argument(s)!
     */
    static missing_args(missing: number, name: string, examples: string[]) {
        return this.fail(`
        ${missing} argument${missing === 1 ? ' is' : 's are'} required!

        ${examples.map(e => `\`\`${name} ${e}\`\``).join('\n')}
        `);
    }
}
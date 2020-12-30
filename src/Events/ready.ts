import { Event } from '../Structures/Event.js';
import { ClientEvents, MessageEmbed } from 'discord.js';
import { formatDate } from '../lib/Utility/Date.js';
import { client } from '../index.js';
import config from '../../config.json';

const { botOwner } = config;

export default class implements Event {
    name: keyof ClientEvents = 'ready';

    async init() {
        const s = `Logged in at ${formatDate('MMMM Do, YYYY hh:mm:ssA', new Date())}`;
        console.log(s);
        
        if(typeof botOwner === 'string') {
            const user = await client.users.fetch(botOwner);
            await user.send(new MessageEmbed().setDescription(s).setColor('#ffe449')); 
        }
    }
}
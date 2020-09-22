import { Command } from '../../Structures/Command';
import { Message } from 'discord.js';

/**
 * List of all sites available.
 * @see https://d33wubrfki0l68.cloudfront.net/js/ac60b9af5090596957c418e9096d00818e70b13b/js/uselessweb.js
 */
const list = [
    'http://heeeeeeeey.com/',
    'http://corndog.io/',
    'https://alwaysjudgeabookbyitscover.com',
    'http://thatsthefinger.com/',
    'http://cant-not-tweet-this.com/',
    'http://weirdorconfusing.com/',
    'http://eelslap.com/',
    'http://www.staggeringbeauty.com/',
    'http://burymewithmymoney.com/',
    'https://smashthewalls.com/',
    'http://endless.horse/',
    'http://www.trypap.com/',
    'http://www.republiquedesmangues.fr/',
    'http://www.movenowthinklater.com/',
    'http://www.partridgegetslucky.com/',
    'http://www.rrrgggbbb.com/',
    'http://beesbeesbees.com/',
    'http://www.koalastothemax.com/',
    'http://www.everydayim.com/',
    'http://randomcolour.com/',
    'http://cat-bounce.com/',
    'http://chrismckenzie.com/',
    'https://thezen.zone/',
    'http://hasthelargehadroncolliderdestroyedtheworldyet.com/',
    'http://ninjaflex.com/',
    'http://ihasabucket.com/',
    'http://corndogoncorndog.com/',
    'http://www.hackertyper.com/',
    'https://pointerpointer.com',
    'http://imaninja.com/',
    'http://drawing.garden/',
    'http://www.ismycomputeron.com/',
    'http://www.nullingthevoid.com/',
    'http://www.muchbetterthanthis.com/',
    'http://www.yesnoif.com/',
    'http://lacquerlacquer.com',
    'http://potatoortomato.com/',
    'http://iamawesome.com/',
    'https://strobe.cool/',
    'http://www.pleaselike.com/',
    'http://crouton.net/',
    'http://corgiorgy.com/',
    'http://www.wutdafuk.com/',
    'http://unicodesnowmanforyou.com/',
    'http://www.crossdivisions.com/',
    'http://tencents.info/',
    'http://www.patience-is-a-virtue.org/',
    'http://pixelsfighting.com/',
    'http://isitwhite.com/',
    'https://existentialcrisis.com/',
    'http://onemillionlols.com/',
    'http://www.omfgdogs.com/',
    'http://oct82.com/',
    'http://chihuahuaspin.com/',
    'http://www.blankwindows.com/',
    'http://dogs.are.the.most.moe/',
    'http://tunnelsnakes.com/',
    'http://www.trashloop.com/',
    'http://www.ascii-middle-finger.com/',
    'http://spaceis.cool/',
    'http://www.donothingfor2minutes.com/',
    'http://buildshruggie.com/',
    'http://buzzybuzz.biz/',
    'http://yeahlemons.com/',
    'http://wowenwilsonquiz.com',
    'https://thepigeon.org/',
    'http://notdayoftheweek.com/',
    'http://www.amialright.com/',
    'http://nooooooooooooooo.com/',
    'https://greatbignothing.com/',
    'https://zoomquilt.org/',
    'https://dadlaughbutton.com/',
    'https://www.bouncingdvdlogo.com/'
]

export default class extends Command {
    constructor() {
        super(
            [
                'Visit a useless site!',
                ''
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'theuselessweb',
                folder: 'Fun',
                args: [0, 0],
                aliases: [ 'uselessweb' ]
            }
        );
    }

    async init(message: Message) {
        const random = list[Math.random() * list.length << 0];
        return message.channel.send(this.Embed.success(random));
    }
}
import { Command, Arguments } from '../../../Structures/Command.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { URLFactory } from '../../../lib/Utility/Valid/URL.js';
import { dontThrow } from '../../../lib/Utility/Don\'tThrow.js';
import { Message, MessageActionRow } from 'discord.js';
import { RedditData } from '@khaf/badmeme';
import { fetch } from 'undici';
import { decodeXML } from 'entities';
import { split } from '../../../lib/Utility/String.js';
import { Components, disableAll } from '../../../lib/Utility/Constants/Components.js';

const fetchDeleted = async (postId: string) => {
    const ac = new AbortController();
    const id = parseInt(postId, 36);
    if (Number.isNaN(id)) return null;

    const timeout = setTimeout(() => ac.abort(), 30000).unref();
	const query = { query: { term: { id } } };
    const elasticURL = `https://elastic.pushshift.io/rs/submissions/_search?source=${JSON.stringify(query)}`;

	const [err, r] = await dontThrow(fetch(elasticURL, {
        headers: {
            'Content-Type': 'application/json',
            'Referer': 'https://www.reddit.com/',
        },
        signal: ac.signal
    }));

    clearTimeout(timeout);
    if (err !== null) return null;

    return await r.json() as PushShiftError | PushShiftGood;
}

interface PushShiftError {
    error: {
        root_cause: unknown[]
        type: string
        reason: string
        phase: string
        grouped: boolean
        failed_shards: unknown[]
    }
    status: number
}

interface PushShiftGood {
    hits: {
        total: number
        max_score: number
        hits: {
            _index: string
            _type: string
            _id: string
            _score: number
            _source: RedditData['data']['children'][number]['data']
        }[]
    }
}

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get the content of a deleted post on Reddit.',
                'https://www.reddit.com/r/gaming/comments/odbzl1/beware_of_a_very_well_made_phishing_scam_on_steam/'
            ], 
            {
                name: 'removeddit',
                folder: 'Fun',
                aliases: [ 'ceddit', 'reveddit' ],
                args: [1, 1],
                ratelimit: 7
            }
        );
    }

    async init(message: Message, { args }: Arguments) {
        const url = URLFactory(args[0]);

        void message.channel.sendTyping();

        if (url === null) {
            return this.Embed.fail(`That's not a Reddit post!`);
        } else if (
            url.host !== 'www.reddit.com' && 
            url.host !== 'reddit.com' &&
            url.host !== 'old.reddit.com'
        ) {
            return this.Embed.fail(`${url.hostname} isn't Reddit!`);
        }

        const [rSlash, subreddit, comments, id, /*threadName*/] = url.pathname.match(/[^/?]*[^/?]/g) ?? [];

        if (
            rSlash !== 'r' ||
            !/^[A-z0-9_]{3,21}$/.test(subreddit) ||
            comments !== 'comments'
        ) {
            return this.Embed.fail(`Invalid or unsupported Reddit link!`);
        }

        const r = await fetchDeleted(id);

        if (r === null) {
            return this.Embed.fail(`No post given the URL was indexed, sorry!`);
        } else if ('error' in r) {
            return this.Embed.fail(`No results found, some posts might not be cached yet!`);
        } else if (r.hits.total < 1) {
            return this.Embed.fail(`No results were found!`);
        }

        const post = r.hits.hits[0]._source;
        const title = post.title.slice(0, 256);
        const thumbnail = post.thumbnail !== 'self' && URLFactory(post.thumbnail) !== null;

        let idx = 0;
        const chunks = split(post.selftext, 2048);
        const makeEmbed = () => {
            const desc = post.selftext.length === 0 ? post.url : decodeXML(chunks[idx]);
            const embed = this.Embed.success()
                .setTitle(title)
                .setDescription(desc);

            if (thumbnail) {
                embed.setThumbnail(post.thumbnail);
            }

            return embed;
        }

        if (post.selftext.length > 2048) {
            const [e, m] = await dontThrow(message.reply({
                embeds: [makeEmbed()],
                components: [
                    new MessageActionRow().addComponents(
                        Components.approve('Next', 'next'),
                        Components.primary('Back', 'back'),
                        Components.deny('Stop', 'stop')
                    )
                ]
            }));

            if (e !== null) return;

            const c = m.createMessageComponentCollector({
                filter: (interaction) =>
                    interaction.user.id === message.author.id,
                time: 300_000,
                max: chunks.length,
                idle: 60_000
            });

            c.on('collect', (i) => {
                if (i.customId === 'deny' || c.total >= chunks.length) {
                    return c.stop();
                }

                i.customId === 'approve' ? idx++ : idx--;

                if (idx < 0) idx = chunks.length - 1;
                if (idx >= chunks.length) idx = 0;

                return void dontThrow(i.update({
                    embeds: [makeEmbed()]
                }));
            });

            c.once('end', (i) => {
                if (i.size === 0 || i.last()!.replied) {
                    return void dontThrow(m.edit({
                        components: disableAll(m)
                    }));
                }

                if (i.last()!.replied) return; 
                
                return void dontThrow(i.last()!.update({
                    components: disableAll(m)
                }));
            });
        } else {
            return makeEmbed();
        }
    }
}
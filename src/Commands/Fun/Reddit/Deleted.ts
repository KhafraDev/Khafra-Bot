import { Arguments, Command } from '#khaf/Command';
import { Components } from '#khaf/utility/Constants/Components.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { Paginate } from '#khaf/utility/Discord/Paginate.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { split } from '#khaf/utility/String.js';
import { URLFactory } from '#khaf/utility/Valid/URL.js';
import { ActionRow, MessageActionRowComponent, type UnsafeEmbed } from '@discordjs/builders';
import { Reddit } from '@khaf/badmeme';
import { Message } from 'discord.js';
import { decodeXML } from 'entities';
import { clearTimeout, setTimeout } from 'timers';
import { fetch } from 'undici';

const fetchDeleted = async (postId: string): Promise<PushShiftGood | PushShiftError | null> => {
    const ac = new AbortController();
    const id = parseInt(postId, 36);
    if (Number.isNaN(id)) return null;

    const timeout = setTimeout(() => ac.abort(), 30000).unref();
    const query = { query: { term: { id } } };
    const elasticURL = `https://elastic.pushshift.io/rs/submissions/_search?source=${JSON.stringify(query)}`;

    const [err, r] = await dontThrow(fetch(elasticURL, {
        headers: {
            'Content-Type': 'application/json',
            'Referer': 'https://www.reddit.com/'
        },
        signal: ac.signal
    }));

    clearTimeout(timeout);
    if (err !== null) return null;
    if (!r.ok) return null;

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
            _source: Required<Reddit>['data']['children'][number]['data']
        }[]
    }
}

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Get the content of a deleted post on Reddit.',
                'https://www.reddit.com/r/gaming/comments/odbzl1/beware_of_a_very_well_made_phishing_scam_on_steam/'
            ],
            {
                name: 'removeddit',
                folder: 'Fun',
                aliases: ['ceddit', 'reveddit'],
                args: [1, 1],
                ratelimit: 7
            }
        );
    }

    async init (message: Message, { args }: Arguments): Promise<UnsafeEmbed | void> {
        const url = URLFactory(args[0]);

        void message.channel.sendTyping();

        if (url === null) {
            return Embed.error('That\'s not a Reddit post!');
        } else if (
            url.host !== 'www.reddit.com' &&
            url.host !== 'reddit.com' &&
            url.host !== 'old.reddit.com'
        ) {
            return Embed.error(`${url.hostname} isn't Reddit!`);
        }

        const [rSlash, subreddit, comments, id] = url.pathname.match(/[^/?]*[^/?]/g) ?? [];

        if (
            rSlash !== 'r' ||
            !/^[A-z0-9_]{3,21}$/.test(subreddit) ||
            comments !== 'comments'
        ) {
            return Embed.error('Invalid or unsupported Reddit link!');
        }

        const r = await fetchDeleted(id);

        if (r === null) {
            return Embed.error('No post given the URL was indexed, sorry!');
        } else if ('error' in r) {
            return Embed.error('No results found, some posts might not be cached yet!');
        } else if (r.hits.total < 1) {
            return Embed.error('No results were found!');
        }

        const post = r.hits.hits[0]._source;
        const title = post.title.slice(0, 256);
        const thumbnail = post.thumbnail !== 'self' && URLFactory(post.thumbnail) !== null;

        const chunks = split(post.selftext, 2048);
        const makeEmbed = (page = 0): UnsafeEmbed => {
            const desc = post.selftext.length === 0 ? post.url : decodeXML(chunks[page]);
            const embed = Embed.ok()
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
                    new ActionRow<MessageActionRowComponent>().addComponents(
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

            return Paginate(c, m, chunks.length, makeEmbed);
        } else {
            return makeEmbed();
        }
    }
}
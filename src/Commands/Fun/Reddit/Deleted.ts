import { Command, Arguments } from '../../../Structures/Command.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { URLFactory } from '../../../lib/Utility/Valid/URL.js';
import { Message } from 'discord.js';
import { RedditData } from '@khaf/badmeme';
import fetch from 'undici-fetch';

const headers = {
	'Content-Type': 'application/json',
	'Referer': 'https://www.reddit.com/',
};

const fetchDeleted = async (postId: string) => {
    const id = parseInt(postId, 36);
    if (Number.isNaN(id)) return null;

	const query = { query: { term: { id } } };
    const elasticURL = `https://elastic.pushshift.io/rs/submissions/_search?source=${JSON.stringify(query)}`;

	const r = await fetch(elasticURL, { headers });
    const j = await r.json() as PushShiftError | PushShiftGood;

    return j;
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

    async init(_message: Message, { args }: Arguments) {
        const url = URLFactory(args[0]);

        if (url === null) {
            return this.Embed.fail(`That's not a Reddit post!`);
        } else if (url.host !== 'www.reddit.com' && url.host !== 'reddit.com') {
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
            return this.Embed.fail(`Invalid post ID!`);
        } else if ('error' in r) {
            return this.Embed.fail(`No results found, some posts might not be cached yet!`);
        } else if (!r.hits?.hits?.[0]) {
            return this.Embed.fail(`No results were found!`);
        }

        const post = r.hits.hits[0]._source;
        const title = post.title.slice(0, 256);

        return this.Embed.success()
            .setThumbnail(post.thumbnail)
            .setTitle(title)
            // TODO(@KhafraDev): add pagination
            .setDescription(post.selftext.slice(0, 2048) || post.url)
    }
}
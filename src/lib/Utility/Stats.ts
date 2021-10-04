import { writeFile } from 'fs/promises';
import { join } from 'path';
import { assets } from './Constants/Path.js';
import { createFileWatcher } from './FileWatcher.js';
import { once } from './Memoize.js';

const path = join(assets, 'JSON/stats.json');
const config = createFileWatcher({} as typeof import('../../../assets/JSON/stats.json'), path);

export class Stats {
    static messages = 0;
    static session = 0;

    static get stats() {
        return {
            globalCommandsUsed: config.globalCommandsUsed + Stats.session,
            globalMessages: config.globalMessages + Stats.messages
        } as typeof config;
    }

    static write = once(() => {
        setInterval(() => {
            const {
                globalCommandsUsed,
                globalMessages
            } = Stats.stats;

            void writeFile(path, JSON.stringify({
                globalCommandsUsed: globalCommandsUsed + Stats.session,
                globalMessages: globalMessages + Stats.messages
            } as typeof config));

            Stats.messages = 0;
            Stats.session = 0;
        }, 60 * 1000);
    });
}

void Stats.write();
import { join } from 'path';
import betterSQLite3 = require('better-sqlite3');

const db = betterSQLite3(join(process.cwd(), 'build/Structures/GuildSettings/guildsettings.db'));

export default db;
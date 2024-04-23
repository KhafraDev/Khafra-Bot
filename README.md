# Khafra-Bot
A multi-purpose bot that enhances Discord.

# Commercial Usage
* Khafra-Bot does not sell access to any content or features. ♥️

# Setup
1. Install dependencies using `npm i`.
2. Follow [nodesource's](https://nodesource.com/blog/running-your-node-js-app-with-systemd-part-1/) guide for running Node.js apps with `systemd`.
3. Create a `.env` file in the root directory and fill in the required values.
4. Edit the [config](./config.json) file.
* For multiple bot owners, an array can be used, or a single string.
5. Install Postgres. For Windows:
    - Download and setup WSL2
    - [Installing Postgres with WSL2](https://docs.microsoft.com/en-us/windows/wsl/tutorials/wsl-database#install-postgresql)
6. Create a new user account in Postgres with the same name as specified in the `.env` file.
    - `sudo -u postgres psql`
    - `CREATE USER [username] WITH PASSWORD '[password]';`
    - `ALTER USER [username] WITH SUPERUSER;`
7. Run the bot:
    - dev: `npm run dev:build && npm run dev:run`
    - prod: `npm run dev:build && npm run prod:run`

# Example Config Files:

khafra_bot.service:
```
[Unit]
Description=Khafra Bot
Documentation=https://example.com
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/Khafra-Bot
ExecStart=/root/.volta/tools/image/node/21.7.3/bin/node --disable-proto=throw -r ./scripts/env.cjs build/src/index.mjs
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

.env:
```
HERE_WEATHER: string
NASA: string
OWLBOTIO: string | undefined
POCKET_CONSUMER_KEY: string
POCKET_SECRET_KEY: string
POSTGRES_USER: string | undefined
POSTGRES_PASS: string | undefined
TMDB: string
TOKEN: string
WORKER_API_BASE: string | undefined
WORKER_BIBLE_BASE: string | undefined
```

## Migrating Versions

### v1.0.9 -> v1.10
1. `npm run v1.10` (dumps the current postgres databases for a few commands to JSON).
2. `npm i better-sqlite3`
3. `npm run dev:build && npm run prod:run`
4. Open postgres shell and `ALTER TABLE kbGuild ADD COLUMN reactRoleChannel TEXT DEFAULT NULL;`
    - Windows tutorial [here](https://www.tutorialkart.com/postgresql/postgresql-sql-shell-psql/)!
    - Linux: `sudo -u postgres psql`, `\c kb`, run the command above, `\q`.

### v1.10 -> v1.11
1. `npm rebuild esqlite` if moving to Node v17+

## CLI Args
- `--prod` (none): runs the bot in production mode
- `--disabled` (string[]): disables commands listed

# Khafra-Bot
A Discord.js framework and bot that is extendable and fast. 

# Commercial Usage
* Khafra-Bot does not sell access to any content or features.

# Environment
* Khafra-Bot has been tested on both Windows 10 and Ubuntu. 
* Khafra-Bot will always support and use new features and will not support old versions of Node.
* The bot currently supports v16.10.0 or above, although the *latest* version of Node is recommended.

# Privacy
When using the bot, a correlating log entry will be generated. Actions are only logged when directly interacting with the bot (such as using a command).

An example log is saved as follows:
```
[Fri Sep 24 2021 17:31:56 GMT-0400 (Eastern Daylight Time)] Message: "Command: about | Author: 267774648622645249 | URL: https://discord.com/channels/503024525076725771/503024525076725775/891074503252250714 | Guild: 503024525076725771 | Input: !!about"
```
The only personally identifiable information kept is your Discord user id, which is publicly available to any Discord user.

Logs are used in order to debug errors and are never sent to a third party.

# Setup
1. Install dependencies using ``npm i``.
2. Install pm2 globally using ``npm i -g pm2``.
3. Create a ``.env`` file in the root directory and fill in the required values.
```
TOKEN=[Discord Token]
SPOTIFY_ID=[Spotify App ID]
SPOTIFY_SECRET=[Spotify Secret]
POCKET_CONSUMER_KEY=[Pocket API Key]
POCKET_SECRET_KEY=[32 digit random password]
HERE_WEATHER=[Weather API]
GOOGLE_API=[Google API Key]
OWLBOTIO=[Owlbot.io free API token]
NASA=[Optional NASA key, data is already saved.]
TWITTER_API=
TWITTER_API_SECRET=
POSTGRES_USER=
POSTGRES_PASS=
TMDB=
IMGUR_CLIENT_ID=
```
All values are required, as there is no guarantee that there is error handling for missing credentials. 

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
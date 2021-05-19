# Khafra-Bot
A Discord.js framework and bot that is extendable and fast. 

# Commercial Usage
* Khafra-Bot does not sell access to any content or features.

# Environment
* Khafra-Bot has been tested on both Windows 10 and Ubuntu. 
* Khafra-Bot will always support and use new features and will not support old versions of Node.
* The bot currently supports v15.4.0 or above, although the *latest* version of Node is recommended.

# Privacy
```md
When using Khafra-Bot some information about you and the command used will be temporarily stored. The purpose of these logs is to provide debug info if errors or misuse occur. A complete log entry looks like:

``[08-26-2020 09:42:09PM] Message: "Command: minesweeper | Author: 267774648622645249 | URL: https://discord.com/channels/677271830838640680/733157666737881149/748356650515300394 | Guild: 677271830838640680 | Input: !minesweeper"``

These logs are temporary and only stored when using the bot (whether that is reacting for a role or using a command).
Read through the terms of service for bot developers at https://discord.com/developers/docs/legal (collecting logs falls under section 2-A).
```
Excerpted from [here](https://discord.com/channels/677271830838640680/705894525473784303/748361427328303175).

# Setup
1. Install dependencies using ``npm i``.
2. Install pm2 globally using ``npm i -g pm2``.
3. Create a ``.env`` file in the root directory and fill in the required values.
```
DB_USER=[OPTIONAL]
DB_PASSWORD=[OPTIONAL]
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
```
All values are required, as there is no guarantee that there is error handling for missing credentials. 

4. Edit the [config](./config.json) file.
* For multiple bot owners, an array can be used, or a single string.
5. Install MongoDB and Postgres. Google instructions for your operating system.
6. Create a new user account in Postgres with the same name as specified in the `.env` file.
7. Open the psql shell and run `ALTER USER [account name] PASSWORD '[password]';`.
8. Run the bot:
    - Windows: ``npm run dev:run``
    - Linux/Mac(?): ``npm run prod:run``

# Before the Next Update
* Convert `insights` to postgres.
* Use redis for commands (`garrison`, `stonewall`, `quran`, etc.).
# v1.0.0
* Initial Release
* Guild settings in progress.
* Few commands.
* Bot structure is relatively close to finished.
* Prefix support.

# v1.0.0~beta1
* Added custom reacts to GuildSettings.
* Embeds are derived from common characteristics.
* Build scripts are now available for ease of access.
* Intelligently caches GuildSettings.
* Lots of logic and parsing errors were fixed.

# v1.0.0~beta2
* Cleanup on some commands and functions.
* GuildSettings: react to a message for a role. New message, old message, guild emoji, unicode emoji. Tweak this setting to your liking.
* Include typings for twemoji-parser.
* Remove inferred return types, add in other types.

# v1.0.0~beta3
* Ban now accepts a mention or a user's ID.
* Fixed a few permission issues.
* Better way of getting a user's avatar.
* Default permissions for commands are automatically added.
* GuildSettings: react roles are now stable, and many issues have been resolved.

# v1.0.0~beta4
* Split events into separate files.
* Add in a cooldown for commands.
* Removing a reaction from a react role will now remove the role.
* ``loadCommands`` now works on nested directories and no longer requires arguments.
* ``Sanitize`` has been removed from the ``Command`` class.
* Token is loaded from environment variables instead of ``KhafraClient``.
* Add ``mdn`` command for searching Mozilla Development Network easily.
* Add ``npm`` command for searching npmjs.com.
* Functional date formatter without external dependencies.

# v1.0.0~beta5
* Add in Spotify command.
* Use ``node-fetch`` for http requests. 
* Remove as many ``any`` types as possible.
* Separate types/interfaces in a separate folder.
* Fix a missing permissions bug in both messageReactionAdd and messageReactionRemove events.
* Fixed randomreacts not working.
* Remove member from random reacts.
* Remove a role react.

# v1.0.0~beta6
* Spotify command now defaults to the current song playing if no query is provided.
* Add in a ``role`` command, similar to user/server/channel lookup.
* Remove ``formatEmbed`` method from all commands that implemented it.
* Add in ``cowsay`` command with Tux and head-in options.
* Add in ``poll`` command to create polls.
* Add in ``discrim`` command to find users with a given discriminator.
* Only fetch columns needed from the database when fetching guild settings.
* Compile TypeScript to ESNext instead of ES6.
* Add in ``tictactoe`` command. For now you can only play against the bot.
* Add in ``help`` command for a description and example(s) of usage.
* Add in ``meepcraft`` command to get the number of players on MeepCraft. Routes request through a proxy.

# v1.0.0~beta7
* Add in ability to ``blacklist`` commands for a user, channel, or entirety of the guild.
* Add in ability to ``whitelist`` commands for a user or channel.
* Add in different ``cowsay`` types.
* Add in ``pocket`` commands which is a partial wrapper for the GetPocket.com API.
* MongoDB handles Pocket command(s). SQLite3 still handles guildsettings.
* Add in ``tags`` command. Small snippets of text that can be returned at any given point.
* Remove useless permission checks in commands.
* ``meepcraft`` command caches latest results for 5 minutes.
* ``tictactoe`` command will intelligently pick spots now.
* ``tictactoe`` will no longer freeze if it's a draw.
* Fixed issue where bot would give cooldowns if a valid command used a different prefix. For example: `+help` would issue a cooldown on the `help` command if the prefix was `!`.

# v1.0.0~beta8
* Added ``pocketadd`` to add articles, videos, or images to your Pocket list!
* ``pocketinit`` is now faster.
* Rename .i.ts files to .d.ts so they aren't transpiled.
* ``messagereact`` is now split into two commands: ``messagereact`` and ``messagereactmessage``. This fixes an issue where a message ID could never be fetched, unless it was in the current channel. GuildSettings will no longer store message content either, as it was unused. 
* On ``messageReactionAdd`` events, if the user isn't manageable by the client, it will (attempt) to DM the user to explain the issue and how to correct it.
* Commands that use the date formatter will now show the timezone (in GMT) and are in 12-hour times rather than 24-hours.
* Fixed a logic error in the ``ban`` command that would incorrectly check which member was bannable.
* Incorrect time inputs in ``ban`` will no longer throw an error.
* Cooldown messages will now tell the user the remaining time until they can use the command again.
* ``list`` command now sorts by category, making it much better.
* Add in ``insights``, which are similar to Discord's insights.
* Replace global ``isNaN`` with ``Number.isNaN``.
* Add in ``trivia``, ``triviahelp``, and ``trivialist`` commands.

# v1.0.0~beta9
* Fixed ``Trivia`` types being compiled.
* MDN command now uses an official search API which I detail [here](https://github.com/Anish-Shobith/mdn-api/issues/2#issuecomment-671545742).
* Fix regressions where ``Number.isNaN`` was used rather than global ``isNaN``.
* Add in ``minesweeper`` command.
* Add in ``nytimes`` command that fetches the most popular articles of the day.
* ``tag`` command will no longer throw an error if no arguments are provided.
* ``Proxy`` helper is now written in ts.
* Add in ``weather`` command.
* ``cowsay`` will no longer crash when a type if given but no text (ie. ``cowsay tux`` would crash).
* Embeds are now easier.
* Add in ``whatisnpm`` command.
* ``help`` command now lists aliases.

# v1.0.0
* Add in ``connect4`` command.
* ``npm`` will no longer crash when invalid packages are queried.
* Commands now work in DMs that aren't marked guild only.
* ``tictactoe`` command will no longer throw an error if the game message was deleted.
* [copy](./scripts/copy.js) is fixed for Windows.
* Add in ``theguardian`` command to search for articles given a date (optional) and a query.
* Add in ``insightsgraph`` command.
* Add in ``warn``, ``getwarns`` and ``setwarn`` commands. ``Setwarn`` will set the number of warning points a user must obtain before getting kicked. ``Getwarn`` will get warnings from another user (if user has KICK_MEMBERS perms) or their own warnings.
* MongoDB now allows username/password authentication.
* Add in ``slots`` command.
* Add in ``youtube`` command that searches for YouTube videos.
* Replace SQLite3 with MongoDB. Remove GuildSettings that were likely buggy, untested, or I weren't happy with.
* Message handler now checks if the first argument has a command name in it. Basically, GuildSettings aren't fetched on every message anymore.
* Add in ``rollingstones`` command to search for the top 500 songs for all time.
* Split functions into separate packages.
* Add in ``giverole`` command, which is a custom command to give a user a role when they use a command.
* Fix all modules using ``RoleManager.fetch`` (Discord.js function), which can return ``Role | null | RoleManager``.
* ``tsconfig.json`` is now slightly more strict.
* Fix ``mask`` throwing an error on message URLs without embeds. Also, it now lists all embeds in a message instead of only one.
* Add in ``bible`` command.
* Replace string to day function in ``ban`` with ``ms``, which happens to be installed already.
* Add in ``enable``, ``disable``, ``unenable``, and ``undisable`` commands. 
* Added typings for all database collections.

# v1.0.1
* Remove most casts to ``any|any[]``. Must be kept in ``Proxy`` helper since its types are trash.
* Remove incorrect types in new Settings commands.
* Remove casts in MessageReaction events that no longer need to be inferred.
* Remove types from ``Bible`` package that were from ``BadMeme``.
* MineSweeper helper will no longer mix ``number`` and ``string`` types.
* Enable ``noImplicitAny`` by default!
* ``TicTacToe`` command has been rewritten and can now be played against the bot or another user! This also fixed a bug when the bot would check for the best spot to go.

# v1.0.2
* Add in [config](./config.json) file to configure bot owner and embed colors.
* Fix an issue in the ``Message`` event that would throw an error.
* Add in ``theonion`` command.
* Add in ``wikipedia`` command.
* Add in ``members`` command which is a smaller way of viewing member count.
* Change insight graph file type to JPG and let matplotlib optimize it. 
* Added a logger for future debugging of issues. Deleted on ``npm run dev:build``.
* Added ``pm2`` configuration and edited production run script to use it.
* Add in ``steal`` command to take an emoji from another server and create one on the current server.

# v1.0.3 - Structure changes.
* Add in ``synergismstats`` command.
* ``channelinfo`` now works on VoiceChannels and NewsChannels.
* Add in basic rate-limiting in ``MessageReactionAdd`` and ``MessageReactionRemove`` events to prevent spam.
* Custom commands will now give confirmation on success.
* Cooldowns are now limited to number of commands a minute rather than a set time. Users can use up to 5 commands a minute (1 every 12 seconds) and a guild is limited to 15 commands a minute (1 every 4 seconds). 
* Cooldowns now apply to commands in DM and custom guild commands. Same rates as normal commands (DM counts as user cooldown).
* Log info on rate-limits.
* ``ban`` can now ban members not in the guild and will prevent errors when the days to clear messages is over 7.
* Custom commands now accept a message on success and the message allows simple formatting. Put ``{user}`` in the message to replace with a mention of the person receiving the role.
* Fix potential errors in ``MessageReactionAdd`` and ``MessageReactionRemove`` events if the message was deleted before a partial reaction could be fetched.
* Re-worked permissions to use native Discord.js loops for checking multiple permissions.
* Re-worked message event to be more readable and maintainable.
* Guild Settings are no longer checked in DMs.
* ``Sanitize`` function now includes updated permissions.
* Fixed a crash in DMs when using ``BadMeme``.
* Fixed a crash in DMs when using ``userinfo``.
* Re-worked Date formatting Utility function. Improved readability and the code is structured better to not rely on so many hard-coded values (for example: string lengths).
* ``Proxy`` util removes last ``as any`` declaration.

# v1.0.4
* Fix concatenation ordering bug in ``Date`` when formatting months.
* Add ``meepmember`` command.
* Fix ``emoji`` command returning no response when no emojis are provided.
* Remove ``cooldown`` option in Commands.
* Add build scripts for Linux.
* Fix an error with ``InsightsGraph`` when a guild had no members joined/left yet.
* Trim strings in ``load.env`` utility function.
* Remove ``insightsinit``. Insights are now tracked automatically.
* Upsert documents for all Guild Settings.
* Add in ``dev:run`` and ``prod:run`` scripts for running the bot without transpiling.
* ``Wikipedia`` command will now give better, more in-depth results. If no results are found it will revert to the old API.
* ``Trivia`` now accepts answer numbers as answers (1, 2, 3, 4, etc.), allows category names or IDs, and is all around better.
* Default prefix can be changed in the [config](./config.json) file.
* ``Tags`` and all helper commands have been rewritten:
1. Subcommands now work. For example, ``tags create`` and ``tagscreate`` perform the same action.
2. Fixed a potential crash in ``tagsinfo`` when no arguments were provided. At the very least it checks if arguments are passed.
3. ``tags info`` now shows transfer history (of latest transfer) to prevent trolls. 
4. ``tagsinit`` has been removed. Tags can be created without extra steps.
* Fix an issue in the message event that would throw an error.
* Custom commands are included in their own cooldown now.
* React roles are now logged.
* Remove ``rollingstones`` command.
* Add in a minimum and optional max arguments settings per command.

# v1.0.5 - Bug Fixes & Structure changes.
* Bot can be mentioned instead of using the prefix. Does not affect commands that rely on mentions.
* If no command is found, Khafra-Bot will suggest a replacement if any commands are similar. Only happens when the command is initialized by mentioning it, to prevent annoyances if another bot with the same prefix is in the server.
* Added bot intents.
* Max arguments for the ``unban`` has been fixed.
* Commands will now properly check permissions in NewsChannels.
* Extra guards in ``message`` to catch bad inputs early.
* ``badmeme`` now fetches the max amount of posts (100), and the cache now stores less, more relevant data. It will also reject on bad data.
* ``insightsdaily`` has been re-written. Now allows a user-inputted amount of days to check and requires ``VIEW_GUILD_INSIGHTS`` permission rather than ``ADMINISTRATOR``.
* Bump ``node-fetch`` to v2.6.1.

# v1.0.6 - Handling the Unhandled & Bug Fixes & Additions
* Handle unhandled rejections without memory leaks.
* ``TextChannel | DMChannel | NewsChannel`` send methods will no longer throw errors on rejections. These methods are Proxied, modifying the prototype to return null and log the error if one occurs. No changes have to be made because it has the same type/return signatures already.
* ``Message#react`` will no longer throw errors similar to ``<Channel>.send``.
* ``clear`` command will now filter messages older than 2 weeks automatically.
* Get welcome/leave messages when a user joins, leaves, is kicked, or banned from a guild.
* Fix multiple issues and replaced bad code when trying to get the correct mentioned user.
* ``user`` command can now fetch information from any Discord account, not just guild members. The old command is under the new name ``member``.
* Catch bad inputs earlier on.
* Add ``discover`` command.
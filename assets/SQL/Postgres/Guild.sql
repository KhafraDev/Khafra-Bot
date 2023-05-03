CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS kbGuild (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    guild_id TEXT NOT NULL,
    max_warning_points SMALLINT DEFAULT 20,
    mod_log_channel TEXT DEFAULT NULL,
    welcome_channel TEXT DEFAULT NULL,
    ticketChannel TEXT DEFAULT NULL,
    "staffChannel" TEXT DEFAULT NULL,
    UNIQUE (guild_id)
);

CREATE TABLE IF NOT EXISTS kbWarns (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    k_guild_id TEXT NOT NULL,
    k_user_id TEXT NOT NULL,
    k_points SMALLINT DEFAULT 1 NOT NULL,
    k_ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (k_guild_id) REFERENCES kbGuild(guild_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS kbInsights (
    id SERIAL PRIMARY KEY,
    k_guild_id TEXT NOT NULL,
    k_date DATE NOT NULL DEFAULT CURRENT_DATE,
    k_left INTEGER NOT NULL DEFAULT 0,
    k_joined INTEGER NOT NULL DEFAULT 0,
    UNIQUE (k_date, k_guild_id)
);

CREATE TABLE IF NOT EXISTS kbGiveaways (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    guildId TEXT NOT NULL,
    messageId TEXT NOT NULL,
    channelId TEXT NOT NULL,
    initiator TEXT NOT NULL,
    endDate TIMESTAMP NOT NULL,
    prize TEXT DEFAULT 'Nothing',
    winners SMALLINT DEFAULT 1,
    "didEnd" BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS "kbReport" (
    id SERIAL PRIMARY KEY,
    reason TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "messageId" TEXT DEFAULT NULL,
    "messageChannelId" TEXT DEFAULT NULL,
    "guildId" TEXT NOT NULL,
    "targetAttachments" TEXT[] DEFAULT NULL,
    "contextAttachments" TEXT DEFAULT NULL,
    "status" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "kbCases" (
    "case" SERIAL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetAttachments" TEXT[] DEFAULT NULL,
    "contextAttachments" TEXT DEFAULT NULL,
    "staffReason" TEXT DEFAULT '',
    "userReason" TEXT DEFAULT '',
    "staffId" TEXT DEFAULT '',
    "associatedTime" TIMESTAMP DEFAULT NULL,
    "guildId" TEXT NOT NULL
);

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS kbGuild (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    guild_id TEXT NOT NULL,
    prefix TEXT DEFAULT '!' NOT NULL,
    max_warning_points SMALLINT DEFAULT 20,
    mod_log_channel TEXT DEFAULT NULL,
    welcome_channel TEXT DEFAULT NULL,
    reactRoleChannel TEXT DEFAULT NULL,
    modRole TEXT DEFAULT NULL,
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
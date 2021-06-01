CREATE TABLE IF NOT EXISTS kbGuild (
    id SERIAL PRIMARY KEY,
    guild_id TEXT NOT NULL,
    prefix TEXT DEFAULT '!' NOT NULL,
    max_warning_points SMALLINT DEFAULT 20,
    mod_log_channel TEXT DEFAULT NULL,
    welcome_channel TEXT DEFAULT NULL,
    rules_channel TEXT DEFAULT NULL,
    UNIQUE (guild_id)
);

CREATE TABLE IF NOT EXISTS kbWarns (
    id SERIAL PRIMARY KEY,
    k_guild_id TEXT NOT NULL,
    k_user_id TEXT NOT NULL,
    k_points SMALLINT DEFAULT 1 NOT NULL,
    k_ts TIMESTAMP DEFAULT now(),
    k_id SMALLINT NOT NULL,
    FOREIGN KEY (k_guild_id) REFERENCES kbGuild(guild_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS kbRules (
    id SERIAL PRIMARY KEY,
    k_guild_id TEXT NOT NULL,
    rule TEXT NOT NULL,
    rule_id SMALLINT NOT NULL,
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